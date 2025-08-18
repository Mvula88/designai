'use client'

import { useState } from 'react'
import { designTemplates, DesignTemplate } from '@/lib/canvas/design-templates'
import { 
  Sparkles, 
  ShoppingBag, 
  Globe, 
  Briefcase, 
  FileText,
  Rocket,
  ArrowRight,
  Check,
  Star
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const categoryIcons = {
  saas: <Sparkles className="h-5 w-5" />,
  ecommerce: <ShoppingBag className="h-5 w-5" />,
  landing: <Globe className="h-5 w-5" />,
  portfolio: <Briefcase className="h-5 w-5" />,
  blog: <FileText className="h-5 w-5" />,
}

const categoryColors = {
  saas: 'bg-purple-100 text-purple-700 border-purple-200',
  ecommerce: 'bg-green-100 text-green-700 border-green-200',
  landing: 'bg-blue-100 text-blue-700 border-blue-200',
  portfolio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  blog: 'bg-gray-100 text-gray-700 border-gray-200',
}

export function TemplateGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filteredTemplates = selectedCategory === 'all' 
    ? designTemplates 
    : designTemplates.filter(t => t.category === selectedCategory)

  const handleUseTemplate = async (template: DesignTemplate) => {
    try {
      // Create a new design from template
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please login to use templates')
        router.push('/login')
        return
      }

      const { data: design, error } = await supabase
        .from('designs')
        .insert({
          user_id: user.id,
          title: `${template.name} - Copy`,
          description: `Created from ${template.name} template`,
          canvas_data: template.canvasData,
          is_template: false,
          tags: [template.category],
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Template loaded! Start customizing...')
      router.push(`/editor/${design.id}`)
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('Failed to load template')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start with a Designer Template
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional templates that convert to production-ready apps. 
              Just customize and deploy in minutes.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Templates
            </button>
            {Object.keys(categoryIcons).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {categoryIcons[category as keyof typeof categoryIcons]}
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                {/* Canvas Preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400">
                    <div className="grid grid-cols-3 gap-2 p-4">
                      {template.components.slice(0, 6).map((comp, idx) => (
                        <div
                          key={idx}
                          className="bg-white/80 rounded px-2 py-1 text-xs text-gray-600 text-center"
                        >
                          {comp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Premium Badge */}
                {template.isPremium && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Premium
                  </div>
                )}

                {/* Hover Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6 transition-opacity duration-300 ${
                  hoveredTemplate === template.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    Use This Template
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                    categoryColors[template.category as keyof typeof categoryColors]
                  }`}>
                    {categoryIcons[template.category as keyof typeof categoryIcons]}
                    {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {template.description}
                </p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {template.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Components Pills */}
                <div className="flex flex-wrap gap-2">
                  {template.components.slice(0, 3).map((component, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      {component}
                    </span>
                  ))}
                  {template.components.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{template.components.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No templates found in this category.
            </p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 mt-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can't Find What You Need?
          </h2>
          <p className="text-purple-100 text-lg mb-8">
            Start from scratch or request a custom template
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/editor/new')}
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start From Scratch
            </button>
            <button className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors">
              Request Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}