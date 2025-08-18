'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, FileText, Brain, Settings, Shield, BarChart3,
  TrendingUp, Activity, Database, AlertCircle, CheckCircle,
  DollarSign, Zap, HardDrive, Clock, ArrowUp, ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  totalDesigns: number
  aiRequests: number
  storageUsed: number
  revenue: number
  userGrowth: number
  designGrowth: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalDesigns: 0,
    aiRequests: 0,
    storageUsed: 0,
    revenue: 0,
    userGrowth: 0,
    designGrowth: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [systemStatus, setSystemStatus] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    loadDashboardData()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      toast.error('Admin access required')
      router.push('/dashboard')
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load metrics
      const [
        { count: userCount },
        { count: designCount },
        { data: aiUsage },
        { data: analytics },
        { data: logs }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('designs').select('*', { count: 'exact', head: true }),
        supabase.from('ai_usage')
          .select('tokens_used')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('platform_analytics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(7),
        supabase.from('audit_logs')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Calculate metrics
      const todayAnalytics = analytics?.[0] || {}
      const yesterdayAnalytics = analytics?.[1] || {}
      
      const totalTokens = aiUsage?.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0) || 0

      setMetrics({
        totalUsers: userCount || 0,
        activeUsers: todayAnalytics.active_users || 0,
        totalDesigns: designCount || 0,
        aiRequests: aiUsage?.length || 0,
        storageUsed: todayAnalytics.storage_used || 0,
        revenue: 0, // Calculate based on your pricing
        userGrowth: calculateGrowth(todayAnalytics.new_users, yesterdayAnalytics.new_users),
        designGrowth: calculateGrowth(todayAnalytics.total_designs, yesterdayAnalytics.total_designs)
      })

      setRecentActivity(logs || [])

      // Check system status
      setSystemStatus({
        database: 'operational',
        ai: totalTokens < 100000 ? 'operational' : 'high_load',
        storage: todayAnalytics.storage_used < 1000000000 ? 'operational' : 'warning',
        api: 'operational'
      })

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowth = (current: number = 0, previous: number = 0): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600'
      case 'high_load': return 'text-yellow-600'
      case 'warning': return 'text-orange-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const navigationItems = [
    { href: '/admin', icon: BarChart3, label: 'Overview', current: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/designs', icon: FileText, label: 'Designs' },
    { href: '/admin/ai', icon: Brain, label: 'AI Usage' },
    { href: '/admin/moderation', icon: Shield, label: 'Moderation' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' }
  ]

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers.toLocaleString(),
      change: metrics.userGrowth,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Users (24h)',
      value: metrics.activeUsers.toLocaleString(),
      change: 0,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: 'Total Designs',
      value: metrics.totalDesigns.toLocaleString(),
      change: metrics.designGrowth,
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: 'AI Requests (24h)',
      value: metrics.aiRequests.toLocaleString(),
      change: 0,
      icon: Brain,
      color: 'bg-indigo-500'
    },
    {
      title: 'Storage Used',
      value: formatBytes(metrics.storageUsed),
      change: 0,
      icon: HardDrive,
      color: 'bg-yellow-500'
    },
    {
      title: 'Revenue (Monthly)',
      value: `$${metrics.revenue.toLocaleString()}`,
      change: 0,
      icon: DollarSign,
      color: 'bg-emerald-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 min-h-screen">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                <p className="text-gray-400 text-xs">DesignOS Control Center</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.current
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* System Status */}
          <div className="p-4 mt-auto border-t border-gray-800">
            <h3 className="text-gray-400 text-xs font-medium mb-3">SYSTEM STATUS</h3>
            <div className="space-y-2">
              {Object.entries(systemStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm capitalize">{key}</span>
                  <span className={`text-xs font-medium ${getStatusColor(status as string)}`}>
                    {status === 'operational' ? '●' : '⚠'} {(status as string).replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Refresh Data
              </button>
            </div>
          </header>

          {/* Metrics Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {metricCards.map((card, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                      <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                    </div>
                    {card.change !== 0 && (
                      <div className={`flex items-center gap-1 text-sm ${
                        card.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {Math.abs(card.change)}%
                      </div>
                    )}
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((log, i) => (
                        <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className="p-2 bg-gray-100 rounded">
                            <Activity className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {log.profiles?.username || 'System'}
                            </p>
                            <p className="text-sm text-gray-600">{log.action}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-4 space-y-3">
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                  
                  <Link
                    href="/admin/designs"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Review Designs</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                  
                  <Link
                    href="/admin/ai"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">AI Usage Stats</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                  
                  <Link
                    href="/admin/settings"
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">System Settings</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}