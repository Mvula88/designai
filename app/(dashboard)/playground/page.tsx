'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Code2,
  Sparkles,
  Globe,
  Github,
  Rocket,
  FolderOpen,
  Search,
  Star,
  Eye,
  Clock,
  TrendingUp,
  Layers,
  Database,
  GitBranch,
  Cloud,
  Crown,
  Lock,
  Zap,
  Shield,
  Award,
  Filter,
  Grid,
  List,
  ChevronRight,
  ArrowUpRight,
  Infinity,
  Users,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import PricingPlans from '@/components/playground/PricingPlans'

interface Playground {
  id: string
  name: string
  description: string
  framework: string
  language: string
  styling: string
  is_public: boolean
  stars_count: number
  views_count: number
  created_at: string
  updated_at: string
}

interface Template {
  id: string
  name: string
  description: string
  category: string
  framework: string
  thumbnail_url: string
  tags: string[]
  use_count: number
  is_official: boolean
}

export default function PlaygroundPage() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'recent' | 'popular' | 'templates'
  >('all')
  const [creatingPlayground, setCreatingPlayground] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise'>('free')
  const [stats, setStats] = useState({ total: 0, deployed: 0, shared: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPlaygrounds()
    loadTemplates()
    loadUserPlan()
    loadStats()
  }, [filter])

  const loadUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (data?.status === 'active') {
        setUserPlan('pro')
      }
    } catch (error) {
      console.error('Failed to load user plan:', error)
    }
  }

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, count } = await supabase
        .from('playgrounds')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      const deployed = data?.filter(p => p.deployment_url).length || 0
      const shared = data?.filter(p => p.is_public).length || 0

      setStats({ total: count || 0, deployed, shared })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadPlaygrounds = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('playgrounds')
        .select('*')
        .eq('user_id', user.id)

      if (filter === 'recent') {
        query = query.order('created_at', { ascending: false }).limit(10)
      } else if (filter === 'popular') {
        query = query.order('views_count', { ascending: false })
      } else {
        query = query.order('updated_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setPlaygrounds(data || [])
    } catch (error) {
      console.error('Failed to load playgrounds:', error)
      toast.error('Failed to load playgrounds')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('playground_templates')
        .select('*')
        .order('use_count', { ascending: false })
        .limit(6)

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const createNewPlayground = async (templateId?: string) => {
    setCreatingPlayground(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let starterCode = {}
      let name = 'Untitled Project'
      let description = ''
      let framework = 'nextjs'

      if (templateId) {
        const template = templates.find((t) => t.id === templateId)
        if (template) {
          const { data: templateData } = await supabase
            .from('playground_templates')
            .select('*')
            .eq('id', templateId)
            .single()

          if (templateData) {
            starterCode = templateData.starter_code
            name = `${templateData.name} Copy`
            description = templateData.description
            framework = templateData.framework
          }
        }
      }

      const { data, error } = await supabase
        .from('playgrounds')
        .insert({
          user_id: user.id,
          name,
          description,
          framework,
          language: 'typescript',
          styling: 'tailwind',
          current_code: starterCode,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/playground/${data.id}`)
    } catch (error) {
      console.error('Failed to create playground:', error)
      toast.error('Failed to create playground')
    } finally {
      setCreatingPlayground(false)
    }
  }

  const deletePlayground = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playground?')) return

    try {
      const { error } = await supabase.from('playgrounds').delete().eq('id', id)

      if (error) throw error

      toast.success('Playground deleted')
      loadPlaygrounds()
    } catch (error) {
      toast.error('Failed to delete playground')
    }
  }

  const filteredPlaygrounds = playgrounds.filter(
    (playground) =>
      playground.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playground.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Professional Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-50" />
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-2.5">
                  <Code2 className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">
                    AI Playground
                  </h1>
                  {userPlan !== 'free' && (
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-semibold text-white">
                      {userPlan.toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Build, deploy, and scale AI-powered applications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPricing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
              >
                <Crown className="h-4 w-4" />
                Upgrade
              </button>
              <button
                onClick={() => createNewPlayground()}
                disabled={creatingPlayground || (userPlan === 'free' && stats.total >= 3)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-white shadow-lg shadow-purple-600/25 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {creatingPlayground ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : userPlan === 'free' && stats.total >= 3 ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Upgrade to Create More
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    New Playground
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Layers className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400">Total Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Rocket className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.deployed}</p>
                <p className="text-xs text-gray-400">Deployed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.shared}</p>
                <p className="text-xs text-gray-400">Shared</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600/20 rounded-lg">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {userPlan === 'free' ? `${3 - stats.total}/3` : <Infinity className="h-5 w-5" />}
                </p>
                <p className="text-xs text-gray-400">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-gray-800 bg-gradient-to-br from-purple-900/20 via-gray-900 to-blue-900/20 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 border border-purple-600/30 mb-4">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Claude 3.5 Sonnet</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">
              Ship production apps in <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">60 seconds</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Describe your idea, and watch AI build a complete full-stack application with backend, database, and authentication.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6 hover:border-purple-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Database className="h-10 w-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Auto Database</h3>
              <p className="text-sm text-gray-400">Supabase provisioned automatically with auth & storage</p>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6 hover:border-blue-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <GitBranch className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Git Integration</h3>
              <p className="text-sm text-gray-400">Push to GitHub with automatic commits and branching</p>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6 hover:border-green-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="h-10 w-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Live Editing</h3>
              <p className="text-sm text-gray-400">Edit your app visually in real-time with instant preview</p>
            </div>
            <div className="group relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6 hover:border-amber-600/50 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Cloud className="h-10 w-10 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Deploy Anywhere</h3>
              <p className="text-sm text-gray-400">One-click deploy to Vercel, Netlify, or your own server</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Start with a template
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => createNewPlayground(template.id)}
                  className="group relative overflow-hidden rounded-lg border bg-white p-4 text-left transition-all hover:shadow-lg"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 p-2">
                      <Code2 className="h-5 w-5 text-violet-600" />
                    </div>
                    {template.is_official && (
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                        Official
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="mb-3 text-sm text-gray-600">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {template.use_count} uses
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search playgrounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 rounded-lg bg-gray-900 border border-gray-700 py-2.5 pl-10 pr-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>
            <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === 'all' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === 'recent' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setFilter('popular')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === 'popular' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Popular
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Playgrounds Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : filteredPlaygrounds.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
            <FolderOpen className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No playgrounds yet
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Create your first AI-powered app
            </p>
            <button
              onClick={() => createNewPlayground()}
              disabled={creatingPlayground}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              Create Playground
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaygrounds.map((playground) => (
              <Link
                key={playground.id}
                href={`/playground/${playground.id}`}
                className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 transition-all hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-600/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-2.5">
                      <Code2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      {playground.is_public && (
                        <Globe className="h-4 w-4 text-green-400" />
                      )}
                      {playground.deployment_url && (
                        <Cloud className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold text-white group-hover:text-purple-300 transition-colors">
                    {playground.name}
                  </h3>
                  <p className="mb-4 text-sm text-gray-400 line-clamp-2">
                    {playground.description || 'No description'}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-purple-600/20 px-2.5 py-1 text-xs text-purple-300 border border-purple-600/30">
                      {playground.framework}
                    </span>
                    <span className="rounded-full bg-blue-600/20 px-2.5 py-1 text-xs text-blue-300 border border-blue-600/30">
                      {playground.language}
                    </span>
                    <span className="rounded-full bg-green-600/20 px-2.5 py-1 text-xs text-green-300 border border-green-600/30">
                      {playground.styling}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {playground.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {playground.stars_count}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(playground.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaygrounds.map((playground) => (
              <Link
                key={playground.id}
                href={`/playground/${playground.id}`}
                className="group flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-600/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-2.5">
                    <Code2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {playground.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-400">
                        {playground.framework} • {playground.language}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {playground.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {playground.stars_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {playground.is_public && (
                    <Globe className="h-4 w-4 text-green-400" />
                  )}
                  {playground.deployment_url && (
                    <Cloud className="h-4 w-4 text-blue-400" />
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <PricingPlans onClose={() => setShowPricing(false)} />
      )}
    </div>
  )
}
