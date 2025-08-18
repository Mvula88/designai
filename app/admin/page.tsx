'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  FileText,
  Brain,
  Settings,
  Shield,
  BarChart3,
  TrendingUp,
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Zap,
  HardDrive,
  Clock,
  ArrowUp,
  ArrowDown,
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
    designGrowth: 0,
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
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
        { data: logs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('designs').select('*', { count: 'exact', head: true }),
        supabase
          .from('ai_usage')
          .select('tokens_used')
          .gte(
            'created_at',
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          ),
        supabase
          .from('platform_analytics')
          .select('*')
          .order('metric_date', { ascending: false })
          .limit(7),
        supabase
          .from('audit_logs')
          .select('*, profiles(username)')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      // Calculate metrics
      const todayAnalytics = analytics?.[0] || {}
      const yesterdayAnalytics = analytics?.[1] || {}

      const totalTokens =
        aiUsage?.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0) || 0

      setMetrics({
        totalUsers: userCount || 0,
        activeUsers: todayAnalytics.active_users || 0,
        totalDesigns: designCount || 0,
        aiRequests: aiUsage?.length || 0,
        storageUsed: todayAnalytics.storage_used || 0,
        revenue: 0, // Calculate based on your pricing
        userGrowth: calculateGrowth(
          todayAnalytics.new_users,
          yesterdayAnalytics.new_users
        ),
        designGrowth: calculateGrowth(
          todayAnalytics.total_designs,
          yesterdayAnalytics.total_designs
        ),
      })

      setRecentActivity(logs || [])

      // Check system status
      setSystemStatus({
        database: 'operational',
        ai: totalTokens < 100000 ? 'operational' : 'high_load',
        storage:
          todayAnalytics.storage_used < 1000000000 ? 'operational' : 'warning',
        api: 'operational',
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateGrowth = (
    current: number = 0,
    previous: number = 0
  ): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600'
      case 'high_load':
        return 'text-yellow-600'
      case 'warning':
        return 'text-orange-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const navigationItems = [
    { href: '/admin', icon: BarChart3, label: 'Overview', current: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/designs', icon: FileText, label: 'Designs' },
    { href: '/admin/ai', icon: Brain, label: 'AI Usage' },
    { href: '/admin/moderation', icon: Shield, label: 'Moderation' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const metricCards = [
    {
      title: 'Total Users',
      value: metrics.totalUsers.toLocaleString(),
      change: metrics.userGrowth,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Users (24h)',
      value: metrics.activeUsers.toLocaleString(),
      change: 0,
      icon: Activity,
      color: 'bg-green-500',
    },
    {
      title: 'Total Designs',
      value: metrics.totalDesigns.toLocaleString(),
      change: metrics.designGrowth,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      title: 'AI Requests (24h)',
      value: metrics.aiRequests.toLocaleString(),
      change: 0,
      icon: Brain,
      color: 'bg-indigo-500',
    },
    {
      title: 'Storage Used',
      value: formatBytes(metrics.storageUsed),
      change: 0,
      icon: HardDrive,
      color: 'bg-yellow-500',
    },
    {
      title: 'Revenue (Monthly)',
      value: `$${metrics.revenue.toLocaleString()}`,
      change: 0,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="min-h-screen w-64 bg-gray-900">
          <div className="p-4">
            <div className="mb-8 flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-gray-400">DesignOS Control Center</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    item.current
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* System Status */}
          <div className="mt-auto border-t border-gray-800 p-4">
            <h3 className="mb-3 text-xs font-medium text-gray-400">
              SYSTEM STATUS
            </h3>
            <div className="space-y-2">
              {Object.entries(systemStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-gray-400">
                    {key}
                  </span>
                  <span
                    className={`text-xs font-medium ${getStatusColor(status as string)}`}
                  >
                    {status === 'operational' ? '●' : '⚠'}{' '}
                    {(status as string).replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="border-b bg-white shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Dashboard Overview
                </h2>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleString()}
                </p>
              </div>
              <button
                onClick={loadDashboardData}
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                Refresh Data
              </button>
            </div>
          </header>

          {/* Metrics Grid */}
          <div className="p-6">
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {metricCards.map((card, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`rounded-lg p-3 ${card.color} bg-opacity-10`}
                    >
                      <card.icon
                        className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`}
                      />
                    </div>
                    {card.change !== 0 && (
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          card.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {card.change > 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        {Math.abs(card.change)}%
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Activity */}
              <div className="rounded-lg bg-white shadow">
                <div className="border-b p-4">
                  <h3 className="font-semibold text-gray-900">
                    Recent Activity
                  </h3>
                </div>
                <div className="p-4">
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((log, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 border-b pb-3 last:border-0"
                        >
                          <div className="rounded bg-gray-100 p-2">
                            <Activity className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {log.profiles?.username || 'System'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {log.action}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-8 text-center text-gray-500">
                        No recent activity
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg bg-white shadow">
                <div className="border-b p-4">
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-3 p-4">
                  <Link
                    href="/admin/users"
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>

                  <Link
                    href="/admin/designs"
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Review Designs</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>

                  <Link
                    href="/admin/ai"
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">AI Usage Stats</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-gray-600" />
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
