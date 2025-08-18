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
  Users,
  Brain,
  Eye,
  TrendingUp,
  Sparkles,
  Upload,
  Wand2,
  LogOut,
  User,
  Settings,
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
}

interface UserProfile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  credits?: number
}

export default function DashboardPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'recent' | 'starred' | 'templates'
  >('all')
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
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login')
        return
      }

      // Get or create user profile
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // If no profile exists, create one
      if (profileError || !profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username: authUser.email?.split('@')[0],
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
            avatar_url: authUser.user_metadata?.avatar_url || '',
            credits: 100
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          // Continue with basic user data even if profile creation fails
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            username: authUser.email?.split('@')[0],
            credits: 100
          })
        } else {
          profile = newProfile
        }
      }

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          credits: profile.credits
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

      if (filter === 'recent') {
        const date = new Date()
        date.setDate(date.getDate() - 7)
        query = query.gte('created_at', date.toISOString())
      } else if (filter === 'templates') {
        query = query.eq('is_template', true)
      }

      const { data, error } = await query

      if (error) throw error
      setDesigns(data || [])
    } catch (error: any) {
      console.error('Failed to load designs:', error)
      toast.error('Failed to load designs')
    } finally {
      setLoading(false)
    }
  }

  const createNewDesign = async () => {
    if (!user) {
      toast.error('Please wait for authentication...')
      return
    }

    setCreatingDesign(true)
    try {
      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: 'Untitled Design',
          user_id: user.id,
          canvas_data: { objects: [], background: '#ffffff' },
          dimensions: { width: 800, height: 600 },
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      if (data && data.id) {
        router.push(`/editor/${data.id}`)
      }
    } catch (error: any) {
      console.error('Failed to create design:', error)
      toast.error('Failed to create design: ' + (error.message || 'Unknown error'))
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
    } catch (error: any) {
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
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Designs</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user?.full_name || user?.username || user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={createNewDesign}
                disabled={creatingDesign || !user}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {creatingDesign ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    New Design
                  </>
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium">
                    {user?.username || user?.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg">
                    <div className="border-b px-4 py-2">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-gray-500">
                        Credits: {user?.credits || 0}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* AI Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            AI-Powered Design Tools
          </h2>
          <p className="text-sm text-gray-600">
            Leverage the power of Claude AI to enhance your designs
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* Design Archaeology Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white transition-transform hover:scale-105">
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-lg bg-white/20 p-3">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Design Archaeology</h3>
              <p className="mb-4 text-sm opacity-90">
                Upload any image and instantly convert it to editable design
                elements
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please sign in first')
                    return
                  }
                  createNewDesign()
                }}
                disabled={creatingDesign}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Try Now
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
          </div>

          {/* Design Memory Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white transition-transform hover:scale-105">
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-lg bg-white/20 p-3">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Design Memory</h3>
              <p className="mb-4 text-sm opacity-90">
                AI learns from your design patterns and personalizes your
                experience
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please sign in first')
                    return
                  }
                  createNewDesign()
                }}
                disabled={creatingDesign}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                Get Started
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
          </div>

          {/* Performance Prediction Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white transition-transform hover:scale-105">
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-lg bg-white/20 p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">Performance Prediction</h3>
              <p className="mb-4 text-sm opacity-90">
                Get real-time predictions of design engagement and effectiveness
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please sign in first')
                    return
                  }
                  createNewDesign()
                }}
                disabled={creatingDesign}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Analyze Now
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Designs</option>
              <option value="recent">Recent</option>
              <option value="templates">Templates</option>
            </select>
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

        {/* Designs Grid/List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No designs yet
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Create your first design to get started
            </p>
            <button
              onClick={createNewDesign}
              disabled={creatingDesign || !user}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
            >
              <Plus className="h-5 w-5" />
              Create Design
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="group relative overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
              >
                <Link href={`/editor/${design.id}`}>
                  <div className="aspect-video bg-gray-100">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="rounded-full bg-gray-200 p-4">
                          <Edit3 className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="mb-1 truncate font-medium text-gray-900">
                    {design.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(design.updated_at).toLocaleDateString()}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/editor/${design.id}`)}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => duplicateDesign(design)}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteDesign(design.id)}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="rounded p-1 text-gray-600 hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4" />
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
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow"
              >
                <Link
                  href={`/editor/${design.id}`}
                  className="flex items-center gap-4"
                >
                  <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Edit3 className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {design.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {design.dimensions.width} × {design.dimensions.height}
                      </span>
                      <span>•</span>
                      <span>
                        Updated{' '}
                        {new Date(design.updated_at).toLocaleDateString()}
                      </span>
                      {design.view_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {design.view_count}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/editor/${design.id}`)}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => duplicateDesign(design)}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100"
                    title="Duplicate"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => deleteDesign(design.id)}
                    className="rounded p-2 text-gray-600 hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button className="rounded p-2 text-gray-600 hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5" />
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