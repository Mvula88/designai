'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Heart,
  Code2,
  Palette,
  ShoppingCart,
  TrendingUp,
  Award,
  Users,
  Package,
  DollarSign,
  Upload,
  Check,
  X,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface MarketplaceComponent {
  id: string
  name: string
  description: string
  category: string
  price: number
  downloads: number
  rating: number
  reviews: number
  author: {
    name: string
    avatar: string
    verified: boolean
  }
  preview: string
  canvasData: any
  tags: string[]
  createdAt: string
  isFree: boolean
  isPopular?: boolean
  isTrending?: boolean
}

// Mock data for demonstration
const mockComponents: MarketplaceComponent[] = [
  {
    id: '1',
    name: 'Modern Hero Section',
    description: 'Stunning hero section with gradient background and CTA buttons',
    category: 'heroes',
    price: 0,
    downloads: 1542,
    rating: 4.8,
    reviews: 234,
    author: {
      name: 'Sarah Designer',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      verified: true,
    },
    preview: '/components/hero-1.png',
    canvasData: {},
    tags: ['hero', 'landing', 'gradient', 'cta'],
    createdAt: '2024-01-15',
    isFree: true,
    isPopular: true,
  },
  {
    id: '2',
    name: 'E-commerce Product Card',
    description: 'Beautiful product card with hover effects and quick actions',
    category: 'cards',
    price: 4.99,
    downloads: 892,
    rating: 4.9,
    reviews: 156,
    author: {
      name: 'Alex Chen',
      avatar: 'https://i.pravatar.cc/150?u=alex',
      verified: true,
    },
    preview: '/components/product-card.png',
    canvasData: {},
    tags: ['ecommerce', 'card', 'product', 'shop'],
    createdAt: '2024-01-20',
    isFree: false,
    isTrending: true,
  },
  {
    id: '3',
    name: 'Dashboard Analytics Widget',
    description: 'Interactive analytics widget with charts and metrics',
    category: 'dashboards',
    price: 9.99,
    downloads: 567,
    rating: 4.7,
    reviews: 89,
    author: {
      name: 'Mike Johnson',
      avatar: 'https://i.pravatar.cc/150?u=mike',
      verified: false,
    },
    preview: '/components/analytics.png',
    canvasData: {},
    tags: ['dashboard', 'analytics', 'charts', 'metrics'],
    createdAt: '2024-01-25',
    isFree: false,
  },
]

const categories = [
  { id: 'all', name: 'All Components', icon: Package },
  { id: 'heroes', name: 'Hero Sections', icon: Award },
  { id: 'cards', name: 'Cards', icon: Code2 },
  { id: 'forms', name: 'Forms', icon: Palette },
  { id: 'dashboards', name: 'Dashboards', icon: TrendingUp },
  { id: 'navigation', name: 'Navigation', icon: Users },
]

export function ComponentMarketplace() {
  const [components, setComponents] = useState<MarketplaceComponent[]>(mockComponents)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price'>('popular')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [cart, setCart] = useState<string[]>([])
  const [savedComponents, setSavedComponents] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Filter components
  const filteredComponents = components.filter(comp => {
    const matchesCategory = selectedCategory === 'all' || comp.category === selectedCategory
    const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          comp.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Sort components
  const sortedComponents = [...filteredComponents].sort((a, b) => {
    if (sortBy === 'popular') return b.downloads - a.downloads
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sortBy === 'price') return a.price - b.price
    return 0
  })

  const handleDownload = async (component: MarketplaceComponent) => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please login to download components')
        router.push('/login')
        return
      }

      // Check if component is free or purchased
      if (!component.isFree && !cart.includes(component.id)) {
        toast.error('Please purchase this component first')
        return
      }

      // Create a new design with the component
      const { data: design, error } = await supabase
        .from('designs')
        .insert({
          user_id: user.id,
          title: component.name,
          description: `Imported from marketplace: ${component.description}`,
          canvas_data: component.canvasData,
          is_template: false,
          tags: component.tags,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Component added to your designs!')
      router.push(`/editor/${design.id}`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download component')
    }
  }

  const handleAddToCart = (componentId: string) => {
    if (cart.includes(componentId)) {
      setCart(cart.filter(id => id !== componentId))
      toast.success('Removed from cart')
    } else {
      setCart([...cart, componentId])
      toast.success('Added to cart')
    }
  }

  const handleSaveComponent = (componentId: string) => {
    if (savedComponents.includes(componentId)) {
      setSavedComponents(savedComponents.filter(id => id !== componentId))
      toast.success('Removed from saved')
    } else {
      setSavedComponents([...savedComponents, componentId])
      toast.success('Saved for later')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Component Marketplace</h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {components.length} Components
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="price">Price: Low to High</option>
              </select>

              {/* Cart */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Sell Component */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Sell Component
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            {/* Categories */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-4 text-white">
              <h3 className="font-semibold mb-4">Marketplace Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-100">Total Downloads</span>
                  <span className="font-bold">12.5K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Active Sellers</span>
                  <span className="font-bold">234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-100">Avg Rating</span>
                  <span className="font-bold">4.8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Component Grid */}
          <div className="flex-1">
            {/* Featured Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Designer Marketplace</h2>
              <p className="text-purple-100 mb-4">
                Buy and sell production-ready components. Earn 70% commission on every sale.
              </p>
              <div className="flex gap-4">
                <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                  Browse Premium
                </button>
                <button className="px-4 py-2 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors">
                  Become a Seller
                </button>
              </div>
            </div>

            {/* Components Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedComponents.map(component => (
                <div
                  key={component.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                >
                  {/* Preview */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {component.isFree && (
                        <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">
                          FREE
                        </span>
                      )}
                      {component.isPopular && (
                        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-bold">
                          POPULAR
                        </span>
                      )}
                      {component.isTrending && (
                        <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-bold">
                          TRENDING
                        </span>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleDownload(component)}
                        className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSaveComponent(component.id)}
                        className="p-3 bg-white rounded-full text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Heart className={`h-5 w-5 ${savedComponents.includes(component.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{component.name}</h3>
                      {!component.isFree && (
                        <span className="text-lg font-bold text-green-600">
                          ${component.price}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {component.description}
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={component.author.avatar}
                        alt={component.author.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-sm text-gray-700">{component.author.name}</span>
                      {component.author.verified && (
                        <Check className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span>{component.rating}</span>
                        <span>({component.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        <span>{component.downloads}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {component.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Button */}
                    {component.isFree ? (
                      <button
                        onClick={() => handleDownload(component)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                      >
                        Download Free
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(component.id)}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          cart.includes(component.id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {cart.includes(component.id) ? (
                          <>
                            <Check className="inline h-4 w-4 mr-1" />
                            In Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="inline h-4 w-4 mr-1" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Sell Your Component</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Modern Hero Section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="9.99"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Hero Sections</option>
                  <option>Cards</option>
                  <option>Forms</option>
                  <option>Dashboards</option>
                </select>
              </div>

              <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag your canvas export here or click to browse
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Earn 70% commission</strong> on every sale. Components are reviewed within 24 hours.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}