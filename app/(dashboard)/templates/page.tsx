'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getTemplates } from '@/lib/templates/get-templates'
import { Template } from '@/lib/templates/template-types'
import { 
  Search, 
  Filter, 
  Code2, 
  Eye, 
  Download,
  Sparkles,
  Lock,
  Unlock,
  Star,
  TrendingUp,
  Clock,
  Grid,
  List,
  ChevronRight,
  Zap,
  ArrowRight,
  Check,
  X,
  Loader2,
  Copy,
  ExternalLink,
  Github,
  Globe,
  Package,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const categories = [
  { id: 'all', name: 'All Templates', icon: Grid },
  { id: 'landing', name: 'Landing Pages', icon: Globe },
  { id: 'dashboard', name: 'Dashboards', icon: Layers },
  { id: 'ecommerce', name: 'E-Commerce', icon: Package },
  { id: 'saas', name: 'SaaS', icon: Zap },
  { id: 'portfolio', name: 'Portfolio', icon: Star },
  { id: 'blog', name: 'Blog', icon: Clock },
  { id: 'admin', name: 'Admin', icon: Lock },
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const templates = getTemplates()
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleImportTemplate = async (templateId: string) => {
    setImporting(templateId)
    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Create a new playground with the template code
      const { data, error } = await supabase
        .from('playgrounds')
        .insert({
          user_id: user.id,
          name: `${template.name} - Copy`,
          description: template.description,
          framework: template.framework,
          language: template.language,
          styling: template.styling,
          current_code: template.code,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Template imported successfully!`)
      router.push(`/playground/${data.id}`)
    } catch (error) {
      console.error('Failed to import template:', error)
      toast.error('Failed to import template')
    } finally {
      setImporting(null)
    }
  }

  const handlePreviewTemplate = (templateId: string) => {
    setShowPreview(showPreview === templateId ? null : templateId)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Templates
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    Ready-to-use templates for your next project
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/playground')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-600/25"
            >
              <Code2 className="h-4 w-4" />
              Blank Project
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-purple-900/20 via-gray-900 to-gray-950 px-4 py-12 border-b border-gray-800">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start with a <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Professional Template</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Choose from our collection of hand-crafted templates. Each template is fully functional, 
            responsive, and ready to customize with your content.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-white">{templates.length}+</p>
              <p className="text-sm text-gray-400">Templates</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-gray-400">Responsive</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">Ready</p>
              <p className="text-sm text-gray-400">To Deploy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 rounded-lg bg-gray-900 border border-gray-700 py-2.5 pl-10 pr-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg bg-gray-900 border border-gray-700 px-4 py-2.5 text-gray-300 focus:outline-none focus:border-purple-600 transition-colors"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode */}
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

        {/* Category Pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
              }`}
            >
              <cat.icon className="h-4 w-4" />
              <span className="text-sm">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 rounded-full bg-gray-900 mb-4">
              <Search className="h-8 w-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 transition-all hover:border-purple-600/50 hover:shadow-lg hover:shadow-purple-600/10"
              >
                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-semibold text-white">
                      <Crown className="h-3 w-3" />
                      PRO
                    </span>
                  </div>
                )}

                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 flex items-center justify-center">
                  <Code2 className="h-16 w-16 text-purple-400" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full bg-gray-800 text-xs text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-1 mb-4">
                    {template.features.slice(0, 3).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-gray-500">
                        <Check className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreviewTemplate(template.id)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleImportTemplate(template.id)}
                      disabled={importing === template.id}
                      className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {importing === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Use
                    </button>
                  </div>
                </div>

                {/* Code Preview (expandable) */}
                {showPreview === template.id && (
                  <div className="border-t border-gray-800 p-4 bg-gray-950">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Code Preview</h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(template.code['app/page.tsx'] || '')
                          toast.success('Code copied!')
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-400 overflow-x-auto max-h-40 overflow-y-auto bg-gray-900 p-3 rounded-lg">
                      <code>{template.code['app/page.tsx']?.slice(0, 500)}...</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-600/50 transition-all"
              >
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20">
                    <Code2 className="h-8 w-8 text-purple-400" />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {template.name}
                      </h3>
                      {template.isPremium && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-semibold text-white">
                          <Crown className="h-3 w-3" />
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        {template.framework} • {template.language} • {template.styling}
                      </span>
                      <div className="flex gap-2">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-gray-800 text-xs text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePreviewTemplate(template.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleImportTemplate(template.id)}
                    disabled={importing === template.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {importing === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Use Template
                      </>
                    )}
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

const Crown = () => (
  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3L2 9l6 2 2-7-5-1zm10 0l-5 1 2 7 6-2-3-6zm-5 8l-3 7h6l-3-7z" />
  </svg>
)