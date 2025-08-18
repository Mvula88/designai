'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Search, Grid, List, Clock, Star, Trash2, 
  MoreVertical, Copy, Share2, Download, LogOut,
  Sparkles, FolderOpen, Users
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
  const [filter, setFilter] = useState<'all' | 'recent' | 'starred' | 'templates'>('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadDesigns()
  }, [filter])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
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
          dimensions: { width: 800, height: 600 }
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
      const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', id)

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
          dimensions: original?.dimensions || { width: 800, height: 600 }
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

  const filteredDesigns = designs.filter(design =>
    design.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-xl font-bold">DesignOS</h1>
              </Link>
              
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-sm ${filter === 'all' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  All Designs
                </button>
                <button
                  onClick={() => setFilter('recent')}
                  className={`text-sm ${filter === 'recent' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setFilter('templates')}
                  className={`text-sm ${filter === 'templates' ? 'text-purple-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Templates
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                <Users className="w-5 h-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
            
            <button
              onClick={createNewDesign}
              className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Design
            </button>
          </div>
        </div>

        {/* Designs Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-2">Loading designs...</p>
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No designs yet</h3>
            <p className="text-gray-600 mb-4">Create your first design to get started</p>
            <button
              onClick={createNewDesign}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Design
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <Link href={`/editor/${design.id}`}>
                  <div className="aspect-video bg-gray-100 relative">
                    {design.thumbnail_url ? (
                      <img
                        src={design.thumbnail_url}
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                  </div>
                </Link>
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">
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
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {/* Dropdown menu would go here */}
                      <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border">
                        <button
                          onClick={() => duplicateDesign(design)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteDesign(design.id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {design.view_count} views
                    </span>
                    {design.is_template && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
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
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                      {design.thumbnail_url ? (
                        <img
                          src={design.thumbnail_url}
                          alt={design.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Sparkles className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{design.title}</h3>
                      <p className="text-sm text-gray-500">
                        Updated {new Date(design.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        duplicateDesign(design)
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        deleteDesign(design.id)
                      }}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
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