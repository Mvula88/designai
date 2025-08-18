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
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
  const [filter, setFilter] = useState<'all' | 'recent' | 'popular' | 'templates'>('all')
  const [creatingPlayground, setCreatingPlayground] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPlaygrounds()
    loadTemplates()
  }, [filter])

  const loadPlaygrounds = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let starterCode = {}
      let name = 'Untitled Project'
      let description = ''
      let framework = 'nextjs'

      if (templateId) {
        const template = templates.find(t => t.id === templateId)
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
      const { error } = await supabase
        .from('playgrounds')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Playground deleted')
      loadPlaygrounds()
    } catch (error) {
      toast.error('Failed to delete playground')
    }
  }

  const filteredPlaygrounds = playgrounds.filter((playground) =>
    playground.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playground.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2">
                  <Code2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">AI Playground</h1>
                  <p className="text-sm text-gray-600">
                    Build full-stack apps with AI in seconds
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => createNewPlayground()}
              disabled={creatingPlayground}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-white shadow-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
            >
              {creatingPlayground ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  New Playground
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="border-b bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-4xl font-bold">
                From idea to deployed app in 60 seconds
              </h2>
              <p className="mb-6 text-lg opacity-90">
                Describe your app, and watch as AI builds it with a real backend, 
                auth, and database. Deploy instantly to Vercel or Netlify.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  <span>Auto-provision Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  <span>GitHub integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  <span>One-click deploy</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                <Sparkles className="mb-2 h-8 w-8" />
                <h3 className="mb-1 font-semibold">AI-Powered</h3>
                <p className="text-sm opacity-90">
                  Claude generates complete, production-ready code
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                <Layers className="mb-2 h-8 w-8" />
                <h3 className="mb-1 font-semibold">Full-Stack</h3>
                <p className="text-sm opacity-90">
                  Frontend, backend, database, and auth included
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                <GitBranch className="mb-2 h-8 w-8" />
                <h3 className="mb-1 font-semibold">Version Control</h3>
                <p className="text-sm opacity-90">
                  Automatic Git commits and branching
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur">
                <Cloud className="mb-2 h-8 w-8" />
                <h3 className="mb-1 font-semibold">Instant Deploy</h3>
                <p className="text-sm opacity-90">
                  Deploy to production with one click
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Templates Section */}
        {templates.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Start with a template</h2>
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
                  <h3 className="mb-1 font-semibold text-gray-900">{template.name}</h3>
                  <p className="mb-3 text-sm text-gray-600">{template.description}</p>
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search playgrounds..."
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
              <option value="all">All Projects</option>
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
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
            <h3 className="mb-2 text-lg font-medium text-gray-900">No playgrounds yet</h3>
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
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlaygrounds.map((playground) => (
              <Link
                key={playground.id}
                href={`/playground/${playground.id}`}
                className="group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 p-2">
                      <Code2 className="h-6 w-6 text-violet-600" />
                    </div>
                    {playground.is_public && (
                      <Globe className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {playground.name}
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    {playground.description || 'No description'}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs text-violet-700">
                      {playground.framework}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      {playground.language}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
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
                <div className="absolute inset-x-0 bottom-0 flex h-1 bg-gradient-to-r from-violet-600 to-purple-600 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}