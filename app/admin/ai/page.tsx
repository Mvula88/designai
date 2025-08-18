'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Brain, TrendingUp, DollarSign, Activity, Users, 
  BarChart3, PieChart, Calendar, Download, AlertCircle,
  Zap, Clock, CreditCard, Shield
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface AIUsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageTokensPerRequest: number
  topUsers: Array<{
    user_id: string
    email: string
    request_count: number
    total_tokens: number
  }>
  featureUsage: {
    [key: string]: number
  }
  modelUsage: {
    [key: string]: number
  }
  hourlyUsage: Array<{
    hour: string
    requests: number
  }>
}

export default function AdminAIPage() {
  const [stats, setStats] = useState<AIUsageStats>({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageTokensPerRequest: 0,
    topUsers: [],
    featureUsage: {},
    modelUsage: {},
    hourlyUsage: []
  })
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days')
  const [loading, setLoading] = useState(true)
  const [userCredits, setUserCredits] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadAIUsageStats()
    loadUserCredits()
  }, [dateRange])

  const loadAIUsageStats = async () => {
    setLoading(true)
    try {
      // Calculate date range
      let startDate = new Date()
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case '7days':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30days':
          startDate.setDate(startDate.getDate() - 30)
          break
        case 'all':
          startDate = new Date('2024-01-01')
          break
      }

      // Get AI usage data
      const { data: usage, error } = await supabase
        .from('ai_usage')
        .select('*, profiles(email)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calculate stats
      const totalRequests = usage?.length || 0
      const totalTokens = usage?.reduce((sum, u) => sum + (u.tokens_used || 0), 0) || 0
      const totalCost = usage?.reduce((sum, u) => sum + (u.cost_estimate || 0), 0) || 0
      const averageTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0

      // Top users
      const userMap = new Map()
      usage?.forEach(u => {
        const existing = userMap.get(u.user_id) || {
          user_id: u.user_id,
          email: u.profiles?.email || 'Unknown',
          request_count: 0,
          total_tokens: 0
        }
        existing.request_count++
        existing.total_tokens += u.tokens_used || 0
        userMap.set(u.user_id, existing)
      })
      const topUsers = Array.from(userMap.values())
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 10)

      // Feature usage
      const featureUsage: { [key: string]: number } = {}
      usage?.forEach(u => {
        featureUsage[u.feature] = (featureUsage[u.feature] || 0) + 1
      })

      // Model usage
      const modelUsage: { [key: string]: number } = {}
      usage?.forEach(u => {
        modelUsage[u.model_used] = (modelUsage[u.model_used] || 0) + 1
      })

      // Hourly usage for today
      const hourlyUsage: Array<{ hour: string; requests: number }> = []
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00'
        const count = usage?.filter(u => {
          const date = new Date(u.created_at)
          return date.getHours() === i && 
                 date.toDateString() === new Date().toDateString()
        }).length || 0
        hourlyUsage.push({ hour, requests: count })
      }

      setStats({
        totalRequests,
        totalTokens,
        totalCost,
        averageTokensPerRequest,
        topUsers,
        featureUsage,
        modelUsage,
        hourlyUsage
      })
    } catch (error) {
      console.error('Failed to load AI stats:', error)
      toast.error('Failed to load AI usage statistics')
    } finally {
      setLoading(false)
    }
  }

  const loadUserCredits = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, username, credits')
        .order('credits', { ascending: false })
        .limit(20)

      setUserCredits(data || [])
    } catch (error) {
      console.error('Failed to load user credits:', error)
    }
  }

  const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', userId)

      if (error) throw error

      toast.success('Credits updated')
      loadUserCredits()

      // Log admin action
      await supabase.from('audit_logs').insert({
        action: 'update_credits',
        entity_type: 'user',
        entity_id: userId,
        details: { new_credits: newCredits }
      })
    } catch (error) {
      toast.error('Failed to update credits')
    }
  }

  const exportUsageData = () => {
    const csv = [
      ['Metric', 'Value'].join(','),
      ['Total Requests', stats.totalRequests].join(','),
      ['Total Tokens', stats.totalTokens].join(','),
      ['Total Cost', `$${stats.totalCost.toFixed(2)}`].join(','),
      ['Average Tokens/Request', stats.averageTokensPerRequest].join(','),
      '',
      ['Feature', 'Usage Count'].join(','),
      ...Object.entries(stats.featureUsage).map(([feature, count]) => 
        [feature, count].join(',')
      ),
      '',
      ['Model', 'Usage Count'].join(','),
      ...Object.entries(stats.modelUsage).map(([model, count]) => 
        [model, count].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-usage-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <div className="w-64 bg-gray-900 min-h-screen">
          <div className="p-4">
            <Link href="/admin" className="flex items-center gap-2 mb-8">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                <p className="text-gray-400 text-xs">AI Usage Monitoring</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">AI Usage & Credits</h2>
                  <p className="text-sm text-gray-600">
                    Monitor AI API usage and manage user credits
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  >
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                  <button
                    onClick={exportUsageData}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Brain className="w-8 h-8 text-purple-500" />
                    <span className="text-2xl font-bold">{formatNumber(stats.totalRequests)}</span>
                  </div>
                  <h3 className="text-gray-600 text-sm">Total Requests</h3>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Zap className="w-8 h-8 text-yellow-500" />
                    <span className="text-2xl font-bold">{formatNumber(stats.totalTokens)}</span>
                  </div>
                  <h3 className="text-gray-600 text-sm">Tokens Used</h3>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <span className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</span>
                  </div>
                  <h3 className="text-gray-600 text-sm">Total Cost</h3>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <span className="text-2xl font-bold">{stats.averageTokensPerRequest}</span>
                  </div>
                  <h3 className="text-gray-600 text-sm">Avg Tokens/Request</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Feature Usage */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Feature Usage</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(stats.featureUsage).map(([feature, count]) => (
                      <div key={feature} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm capitalize">{feature.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 bg-purple-600 rounded-full"
                              style={{ 
                                width: `${(count / stats.totalRequests) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Usage */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Model Usage</h3>
                  </div>
                  <div className="p-4">
                    {Object.entries(stats.modelUsage).map(([model, count]) => (
                      <div key={model} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm">{model}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 bg-indigo-600 rounded-full"
                              style={{ 
                                width: `${(count / stats.totalRequests) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Users */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Top AI Users</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Request</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.topUsers.map((user, i) => (
                        <tr key={user.user_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{user.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm">{user.request_count}</td>
                          <td className="px-4 py-3 text-sm">{formatNumber(user.total_tokens)}</td>
                          <td className="px-4 py-3 text-sm">
                            {Math.round(user.total_tokens / user.request_count)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ${(user.total_tokens * 0.00001).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Credits Management */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">User Credits Management</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {userCredits.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.username || user.email}</p>
                          <p className="text-sm text-gray-500">Current credits: {user.credits}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={user.credits}
                            className="w-24 px-2 py-1 border rounded"
                            id={`credits-${user.id}`}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`credits-${user.id}`) as HTMLInputElement
                              updateUserCredits(user.id, parseInt(input.value))
                            }}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}