'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  CreditCard,
  Wallet,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
  Check,
  X,
  Loader2,
  Settings,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Lock,
  Unlock,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface StripeConnectProps {
  playgroundId: string
  onClose?: () => void
}

interface StripeAccount {
  id: string
  connected: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  business_profile?: {
    name: string
    url?: string
  }
  capabilities?: {
    card_payments: string
    transfers: string
  }
  requirements?: {
    current_deadline?: string
    currently_due: string[]
    eventually_due: string[]
  }
}

interface DashboardStats {
  revenue: number
  transactions: number
  customers: number
  avgOrderValue: number
  revenueChange: number
  transactionsChange: number
}

export default function StripeConnect({ playgroundId, onClose }: StripeConnectProps) {
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState<StripeAccount | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0,
    transactions: 0,
    customers: 0,
    avgOrderValue: 0,
    revenueChange: 0,
    transactionsChange: 0
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'settings'>('overview')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    checkStripeConnection()
    if (account?.connected) {
      loadDashboardStats()
    }
  }, [playgroundId])

  const checkStripeConnection = async () => {
    try {
      const response = await fetch(`/api/stripe/connect/status?playgroundId=${playgroundId}`)
      if (response.ok) {
        const data = await response.json()
        setAccount(data.account)
      }
    } catch (error) {
      console.error('Failed to check Stripe connection:', error)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`/api/stripe/connect/dashboard?playgroundId=${playgroundId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    }
  }

  const connectStripe = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playgroundId })
      })

      if (!response.ok) throw new Error('Failed to create onboarding link')

      const { url } = await response.json()
      window.open(url, '_blank')
      
      // Poll for connection status
      const checkInterval = setInterval(async () => {
        await checkStripeConnection()
        if (account?.connected) {
          clearInterval(checkInterval)
          toast.success('Stripe account connected successfully!')
        }
      }, 3000)
      
      setTimeout(() => clearInterval(checkInterval), 60000) // Stop after 1 minute
    } catch (error) {
      console.error('Failed to connect Stripe:', error)
      toast.error('Failed to connect Stripe account')
    } finally {
      setIsConnecting(false)
    }
  }

  const openStripeDashboard = async () => {
    try {
      const response = await fetch('/api/stripe/connect/dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playgroundId })
      })

      if (!response.ok) throw new Error('Failed to create dashboard link')

      const { url } = await response.json()
      window.open(url, '_blank')
    } catch (error) {
      console.error('Failed to open dashboard:', error)
      toast.error('Failed to open Stripe dashboard')
    }
  }

  if (!account?.connected) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 mb-4">
            <CreditCard className="h-12 w-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Connect Stripe to Your App
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Accept payments, manage subscriptions, and track revenue directly in your AI-generated application.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Shield className="h-8 w-8 text-green-400 mb-2 mx-auto" />
              <h4 className="text-sm font-medium text-white mb-1">Secure Payments</h4>
              <p className="text-xs text-gray-400">PCI compliant & encrypted</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Globe className="h-8 w-8 text-blue-400 mb-2 mx-auto" />
              <h4 className="text-sm font-medium text-white mb-1">Global Support</h4>
              <p className="text-xs text-gray-400">135+ currencies supported</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <Zap className="h-8 w-8 text-yellow-400 mb-2 mx-auto" />
              <h4 className="text-sm font-medium text-white mb-1">Instant Setup</h4>
              <p className="text-xs text-gray-400">Start accepting payments now</p>
            </div>
          </div>

          <button
            onClick={connectStripe}
            disabled={isConnecting}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Connect Stripe Account
              </span>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Powered by Stripe Connect • No setup fees • 2.9% + 30¢ per transaction
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-600/20 to-emerald-600/20">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Stripe Connected</h3>
              <p className="text-sm text-gray-400">
                {account.business_profile?.name || 'Your business'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openStripeDashboard}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
            >
              Open Dashboard
            </button>
            <button
              onClick={() => checkStripeConnection()}
              className="p-1.5 text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className={`text-xs flex items-center gap-1 ${
                    stats.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.revenueChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stats.revenueChange)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${(stats.revenue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">Total Revenue</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="h-5 w-5 text-blue-400" />
                  <span className={`text-xs flex items-center gap-1 ${
                    stats.transactionsChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stats.transactionsChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(stats.transactionsChange)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.transactions}</p>
                <p className="text-xs text-gray-400">Transactions</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.customers}</p>
                <p className="text-xs text-gray-400">Customers</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  ${(stats.avgOrderValue / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">Avg. Order Value</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-gray-300">Create Product</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
                <button className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-gray-300">Payment Links</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
                <button className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-gray-300">View Reports</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
                <button className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-300">Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Integration Code */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Integration Code</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <pre className="text-xs text-gray-400 overflow-x-auto">
{`// Add to your app
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe('${account.id}')

// Create checkout session
const session = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({ 
    priceId: 'price_xxx',
    quantity: 1 
  })
})`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-white">Your Products</h4>
              <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all">
                Add Product
              </button>
            </div>
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No products yet</p>
              <p className="text-sm text-gray-500">Create your first product to start selling</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Account Status</h4>
                  <p className="text-xs text-gray-400">
                    {account.charges_enabled ? 'Ready to accept payments' : 'Setup incomplete'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {account.charges_enabled ? (
                    <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {account.requirements?.currently_due.length > 0 && (
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-300 mb-1">
                      Action Required
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      Complete these items to activate your account:
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {account.requirements.currently_due.map((req, i) => (
                        <li key={i}>• {req.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              className="w-full py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
            >
              Open Full Stripe Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}