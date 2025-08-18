'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Clock,
  Rocket,
  Globe,
  Package,
  DollarSign,
  TrendingUp,
  Sparkles,
  MousePointer,
  Code2,
  Layers,
  LogOut,
  Settings,
  Star,
  ShoppingBag,
  Zap,
  Database,
  Palette,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Design {
  id: string
  title: string
  thumbnail_url: string | null
  canvas_data: any
  dimensions: { width: number; height: number }
  created_at: string
  updated_at: string
  is_public: boolean
  is_template: boolean
  view_count: number
  deployed_url?: string
  earnings?: number
}

interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  credits?: number
  total_earnings?: number
  designs_shipped?: number
}

export default function DashboardPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'deployed' | 'drafts' | 'templates'>('all')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [creatingDesign, setCreatingDesign] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadDesigns()
    }
  }, [filter, user])

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username: authUser.email?.split('@')[0],
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            avatar_url: authUser.user_metadata?.avatar_url || '',
            credits: 100,
            total_earnings: 0,
            designs_shipped: 0,
          })
          .select()
          .single()

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          ...newProfile,
        })
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          ...profile,
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/login')
    }
  }

  const loadDesigns = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (filter === 'deployed') {
        query = query.not('deployed_url', 'is', null)
      } else if (filter === 'drafts') {
        query = query.is('deployed_url', null)
      } else if (filter === 'templates') {
        query = query.eq('is_template', true)
      }

      const { data, error } = await query

      if (error) throw error
      setDesigns(data || [])
    } catch (error) {
      console.error('Failed to load designs:', error)
      toast.error('Failed to load designs')
    } finally {
      setLoading(false)
    }
  }

  const createNewDesign = async () => {
    if (!user) return

    setCreatingDesign(true)
    try {
      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: 'Untitled App',
          user_id: user.id,
          canvas_data: { objects: [], background: '#ffffff' },
          dimensions: { width: 1200, height: 800 },
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        router.push(`/editor/${data.id}`)
      }
    } catch (error) {
      console.error('Failed to create design:', error)
      toast.error('Failed to create design')
    } finally {
      setCreatingDesign(false)
    }
  }

  const deleteDesign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return

    try {
      const { error } = await supabase.from('designs').delete().eq('id', id)
      if (error) throw error
      toast.success('Design deleted')
      loadDesigns()
    } catch (error) {
      toast.error('Failed to delete design')
    }
  }

  const duplicateDesign = async (design: Design) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: `${design.title} (Copy)`,
          user_id: user.id,
          canvas_data: design.canvas_data,
          dimensions: design.dimensions,
          is_template: false,
        })
        .select()
        .single()

      if (error) throw error
      toast.success('Design duplicated')
      loadDesigns()
    } catch (error) {
      toast.error('Failed to duplicate design')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const filteredDesigns = designs.filter((design) =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalDesigns: designs.length,
    deployed: designs.filter(d => d.deployed_url).length,
    earnings: user?.total_earnings || 0,
    views: designs.reduce((sum, d) => sum + (d.view_count || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DesignShip</h1>
                  <p className="text-xs text-gray-600">Ship Without Code</p>
                </div>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/templates" className="text-gray-700 hover:text-gray-900 font-medium">
                  Templates
                </Link>
                <Link href="/marketplace" className="text-gray-700 hover:text-gray-900 font-medium">
                  Marketplace
                </Link>
                <Link href="/playground" className="text-gray-700 hover:text-gray-900 font-medium">
                  AI Playground
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={createNewDesign}
                disabled={creatingDesign}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
              >
                {creatingDesign ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    New Design
                  </>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 hover:bg-gray-50"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl bg-white shadow-xl border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-900">{user?.full_name || user?.username}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${user?.total_earnings || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Rocket className="h-3 w-3" />
                          {user?.designs_shipped || 0} shipped
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || user?.username || 'Designer'}!
          </h2>
          <p className="text-gray-600">
            Design visually. Ship instantly. No code required.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Designs</span>
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalDesigns}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Apps Shipped</span>
              <Rocket className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.deployed}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Earnings</span>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">${stats.earnings}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Views</span>
              <Eye className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.views}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/templates" className="group">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Package className="h-8 w-8" />
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-bold mb-2">Start from Template</h3>
              <p className="text-purple-100 text-sm">
                Professional templates ready to customize and ship
              </p>
            </div>
          </Link>

          <Link href="/marketplace" className="group">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="h-8 w-8" />
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-bold mb-2">Component Marketplace</h3>
              <p className="text-green-100 text-sm">
                Buy components or sell yours for 70% commission
              </p>
            </div>
          </Link>

          <button onClick={() => router.push('/editor/new?mode=database')} className="group text-left">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Database className="h-8 w-8" />
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-lg font-bold mb-2">Visual Database</h3>
              <p className="text-indigo-100 text-sm">
                Design your database visually, no SQL needed
              </p>
            </div>
          </button>
        </div>

        {/* Designs Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-full border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'deployed', 'drafts', 'templates'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      filter === f
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 ${
                  viewMode === 'grid'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Designs Grid/List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center bg-white rounded-xl border-2 border-dashed border-gray-300">
            <MousePointer className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No designs yet
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Start designing visually and ship instantly
            </p>
            <button
              onClick={createNewDesign}
              disabled={creatingDesign}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              <Sparkles className="h-5 w-5" />
              Create Your First App
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all"
              >
                <Link href={`/editor/${design.id}`}>
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {design.deployed_url && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Live
                      </div>
                    )}
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Code2 className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {design.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(design.updated_at).toLocaleDateString()}
                    </span>
                    {design.view_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {design.view_count}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/editor/${design.id}`)}
                      className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Edit
                    </button>
                    {design.deployed_url ? (
                      <a
                        href={design.deployed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    ) : (
                      <button
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Deploy"
                      >
                        <Rocket className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => duplicateDesign(design)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteDesign(design.id)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-md hover:shadow-lg transition-all"
              >
                <Link href={`/editor/${design.id}`} className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Code2 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{design.title}</h3>
                      {design.deployed_url && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{design.dimensions.width} × {design.dimensions.height}</span>
                      <span>•</span>
                      <span>Updated {new Date(design.updated_at).toLocaleDateString()}</span>
                      {design.view_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {design.view_count} views
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/editor/${design.id}`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                  >
                    Edit
                  </button>
                  {design.deployed_url ? (
                    <a
                      href={design.deployed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  ) : (
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Rocket className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => duplicateDesign(design)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteDesign(design.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}