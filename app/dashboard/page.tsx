'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  Grid,
  List,
  Clock,
  Star,
  Trash2,
  MoreVertical,
  Copy,
  Share2,
  Download,
  LogOut,
  Sparkles,
  FolderOpen,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Design {
  id: string
  title: string
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  is_public: boolean
  is_template: boolean
  view_count: number
}

export default function DashboardPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<
    'all' | 'recent' | 'starred' | 'templates'
  >('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadDesigns()
  }, [filter])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadDesigns = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('designs')
        .select('*')
        .order('updated_at', { ascending: false })

      if (filter === 'templates') {
        query = query.eq('is_template', true)
      } else if (filter === 'recent') {
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 7)
        query = query.gte('updated_at', recentDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setDesigns(data || [])
    } catch (error: any) {
      toast.error('Failed to load designs')
    } finally {
      setLoading(false)
    }
  }

  const createNewDesign = async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: 'Untitled Design',
          user_id: user?.id,
          canvas_data: { objects: [], background: '#ffffff' },
          dimensions: { width: 800, height: 600 },
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/editor/${data.id}`)
    } catch (error: any) {
      toast.error('Failed to create design')
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
    try {
      const { data: original } = await supabase
        .from('designs')
        .select('canvas_data, dimensions')
        .eq('id', design.id)
        .single()

      const { data, error } = await supabase
        .from('designs')
        .insert({
          title: `${design.title} (Copy)`,
          user_id: user?.id,
          canvas_data: original?.canvas_data || { objects: [] },
          dimensions: original?.dimensions || { width: 800, height: 600 },
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
    await supabase.auth.signOut()
    router.push('/')
  }

  const filteredDesigns = designs.filter((design) =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <h1 className="text-xl font-bold">DesignOS</h1>
              </Link>

              <nav className="hidden items-center gap-6 md:flex">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-sm ${filter === 'all' ? 'font-medium text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Designs
                </button>
                <button
                  onClick={() => setFilter('recent')}
                  className={`text-sm ${filter === 'recent' ? 'font-medium text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setFilter('templates')}
                  className={`text-sm ${filter === 'templates' ? 'font-medium text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Templates
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Users className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-2 ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>

            <button
              onClick={createNewDesign}
              className="ml-4 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              New Design
            </button>
          </div>
        </div>

        {/* Designs Grid/List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading designs...</p>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="py-12 text-center">
            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No designs yet
            </h3>
            <p className="mb-4 text-gray-600">
              Create your first design to get started
            </p>
            <button
              onClick={createNewDesign}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Create Design
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
              >
                <Link href={`/editor/${design.id}`}>
                  <div className="relative aspect-video bg-gray-100">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Sparkles className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity group-hover:bg-opacity-10" />
                  </div>
                </Link>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="truncate font-medium text-gray-900">
                        {design.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(design.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          // Toggle dropdown menu
                        }}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>

                      {/* Dropdown menu would go here */}
                      <div className="absolute right-0 mt-2 hidden w-48 rounded-lg border bg-white shadow-lg">
                        <button
                          onClick={() => duplicateDesign(design)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteDesign(design.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {design.view_count} views
                    </span>
                    {design.is_template && (
                      <span className="rounded bg-purple-100 px-2 py-1 text-purple-700">
                        Template
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDesigns.map((design) => (
              <Link
                key={design.id}
                href={`/editor/${design.id}`}
                className="block rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                      {design.thumbnail_url ? (
                        <img
                          src={design.thumbnail_url}
                          alt={design.title}
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        <Sparkles className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {design.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Updated{' '}
                        {new Date(design.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        duplicateDesign(design)
                      }}
                      className="rounded p-2 hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        deleteDesign(design.id)
                      }}
                      className="rounded p-2 hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
