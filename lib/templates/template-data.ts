export interface Template {
  id: string
  name: string
  description: string
  category: 'landing' | 'dashboard' | 'ecommerce' | 'saas' | 'portfolio' | 'blog' | 'social' | 'admin'
  tags: string[]
  thumbnail: string
  framework: 'nextjs' | 'react' | 'vue'
  language: 'typescript' | 'javascript'
  styling: 'tailwind' | 'css'
  features: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  isPremium: boolean
  code: {
    [filename: string]: string
  }
}

export const templates: Template[] = [
  {
    id: 'saas-landing-dark',
    name: 'SaaS Landing Page',
    description: 'Modern SaaS landing page with pricing, features, and testimonials',
    category: 'saas',
    tags: ['landing', 'pricing', 'hero', 'dark-mode', 'animated'],
    thumbnail: '/templates/saas-landing.png',
    framework: 'nextjs',
    language: 'typescript',
    styling: 'tailwind',
    features: ['Responsive Design', 'Dark Mode', 'Pricing Cards', 'Testimonials', 'FAQ Section'],
    difficulty: 'intermediate',
    isPremium: false,
    code: {
      'app/page.tsx': `'use client'

import { useState } from 'react'
import { Check, Menu, X, Star, ArrowRight, Zap, Shield, Globe } from 'lucide-react'

export default function SaaSLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Optimized performance that scales with your business needs'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security for your data'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Global CDN',
      description: 'Deliver content instantly anywhere in the world'
    }
  ]

  const pricing = [
    {
      name: 'Starter',
      price: '$9',
      description: 'Perfect for small projects',
      features: ['5 Projects', '10GB Storage', 'Basic Support', 'API Access'],
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      description: 'For growing businesses',
      features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced API', 'Custom Domain', 'Analytics'],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Support', 'SLA', 'Custom Integration', 'White Label'],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                SaaSify
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition">Testimonials</a>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
                Get Started
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-gray-300 hover:text-white">Features</a>
              <a href="#pricing" className="block px-3 py-2 text-gray-300 hover:text-white">Pricing</a>
              <a href="#testimonials" className="block px-3 py-2 text-gray-300 hover:text-white">Testimonials</a>
              <button className="w-full text-left bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 rounded-lg">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Build Faster. Scale Better.
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            The complete platform for modern SaaS applications. Ship faster with our powerful tools and infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2">
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border border-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-900 transition">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-purple-600 transition">
                <div className="text-purple-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div key={index} className={\`bg-gray-900 p-8 rounded-xl border \${plan.popular ? 'border-purple-600' : 'border-gray-800'} relative\`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full text-sm">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-gray-400">/month</span>}
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={\`w-full py-3 rounded-lg font-semibold transition \${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }\`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "This platform has transformed how we build and deploy our applications. The speed and reliability are unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-gray-400">CTO at TechCorp</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "The best investment we've made for our infrastructure. Incredible performance and amazing support team."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
                <div>
                  <p className="font-semibold">Michael Chen</p>
                  <p className="text-sm text-gray-400">Founder at StartupXYZ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 SaaSify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}`,
      'package.json': `{
  "name": "saas-landing",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "lucide-react": "^0.263.1"
  }
}`
    }
  },
  {
    id: 'ecommerce-store',
    name: 'E-Commerce Store',
    description: 'Complete e-commerce store with product grid, cart, and checkout',
    category: 'ecommerce',
    tags: ['shop', 'products', 'cart', 'checkout', 'payment'],
    thumbnail: '/templates/ecommerce.png',
    framework: 'nextjs',
    language: 'typescript',
    styling: 'tailwind',
    features: ['Product Grid', 'Shopping Cart', 'Search & Filter', 'Product Details', 'Checkout Flow'],
    difficulty: 'advanced',
    isPremium: false,
    code: {
      'app/page.tsx': `'use client'

import { useState } from 'react'
import { ShoppingCart, Search, Filter, Star, Heart, Plus, Minus, X } from 'lucide-react'

interface Product {
  id: number
  name: string
  price: number
  image: string
  rating: number
  category: string
}

export default function EcommerceStore() {
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([])
  const [showCart, setShowCart] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const products: Product[] = [
    { id: 1, name: 'Premium Headphones', price: 299, image: '/api/placeholder/300/300', rating: 4.5, category: 'electronics' },
    { id: 2, name: 'Wireless Mouse', price: 49, image: '/api/placeholder/300/300', rating: 4.2, category: 'electronics' },
    { id: 3, name: 'Mechanical Keyboard', price: 159, image: '/api/placeholder/300/300', rating: 4.8, category: 'electronics' },
    { id: 4, name: 'USB-C Hub', price: 79, image: '/api/placeholder/300/300', rating: 4.3, category: 'accessories' },
    { id: 5, name: 'Laptop Stand', price: 89, image: '/api/placeholder/300/300', rating: 4.6, category: 'accessories' },
    { id: 6, name: 'Webcam HD', price: 129, image: '/api/placeholder/300/300', rating: 4.4, category: 'electronics' },
  ]

  const categories = ['all', 'electronics', 'accessories']

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ShopHub</h1>
            </div>
            
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <div className="flex gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={\`px-4 py-2 rounded-lg capitalize transition \${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }\`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                  <Heart className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={\`h-4 w-4 \${
                          i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }\`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart Sidebar */}
      <div className={\`fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform z-50 \${
        showCart ? 'translate-x-0' : 'translate-x-full'
      }\`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Shopping Cart</h2>
            <button onClick={() => setShowCart(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4 bg-gray-50 p-3 rounded-lg">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <p className="text-gray-600">${item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold">${item.product.price * item.quantity}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between mb-4">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">${cartTotal}</span>
            </div>
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
              Checkout
            </button>
          </div>
        )}
      </div>

      {/* Cart Overlay */}
      {showCart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowCart(false)}
        />
      )}
    </div>
  )
}`,
      'package.json': `{
  "name": "ecommerce-store",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "lucide-react": "^0.263.1"
  }
}`
    }
  },
  {
    id: 'admin-dashboard',
    name: 'Admin Dashboard',
    description: 'Professional admin dashboard with charts, tables, and analytics',
    category: 'admin',
    tags: ['dashboard', 'analytics', 'charts', 'admin', 'data'],
    thumbnail: '/templates/admin.png',
    framework: 'nextjs',
    language: 'typescript',
    styling: 'tailwind',
    features: ['Analytics Charts', 'Data Tables', 'User Management', 'Notifications', 'Dark Mode'],
    difficulty: 'advanced',
    isPremium: true,
    code: {
      'app/page.tsx': `'use client'

import { useState } from 'react'
import { 
  BarChart3, Users, DollarSign, ShoppingBag, TrendingUp, 
  TrendingDown, Calendar, Download, Filter, MoreVertical,
  Bell, Search, Menu, X, Settings, LogOut
} from 'lucide-react'

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const stats = [
    { label: 'Total Revenue', value: '$54,239', change: '+12.5%', trending: 'up', icon: DollarSign },
    { label: 'Total Users', value: '2,543', change: '+5.2%', trending: 'up', icon: Users },
    { label: 'Total Orders', value: '1,234', change: '-2.4%', trending: 'down', icon: ShoppingBag },
    { label: 'Conversion Rate', value: '3.2%', change: '+0.8%', trending: 'up', icon: BarChart3 },
  ]

  const recentOrders = [
    { id: '#12345', customer: 'John Doe', date: '2024-01-15', amount: '$129.99', status: 'completed' },
    { id: '#12346', customer: 'Jane Smith', date: '2024-01-15', amount: '$79.99', status: 'processing' },
    { id: '#12347', customer: 'Bob Johnson', date: '2024-01-14', amount: '$249.99', status: 'completed' },
    { id: '#12348', customer: 'Alice Brown', date: '2024-01-14', amount: '$189.99', status: 'pending' },
    { id: '#12349', customer: 'Charlie Wilson', date: '2024-01-13', amount: '$99.99', status: 'completed' },
  ]

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, active: true },
    { label: 'Users', icon: Users, active: false },
    { label: 'Orders', icon: ShoppingBag, active: false },
    { label: 'Products', icon: Package, active: false },
    { label: 'Analytics', icon: TrendingUp, active: false },
    { label: 'Settings', icon: Settings, active: false },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={\`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all z-40 \${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }\`}>
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={\`flex items-center gap-3 px-4 py-2 rounded-lg transition \${
                  item.active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }\`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button className="flex items-center gap-3 text-gray-300 hover:text-white w-full px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={\`transition-all \${sidebarOpen ? 'ml-64' : 'ml-0'}\`}>
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full" />
                <div>
                  <p className="font-semibold">Admin User</p>
                  <p className="text-sm text-gray-500">admin@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className={\`flex items-center gap-1 text-sm \${
                    stat.trending === 'up' ? 'text-green-600' : 'text-red-600'
                  }\`}>
                    {stat.trending === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue Overview</h3>
                <button className="text-gray-600 hover:text-gray-900">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart Component Here</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Growth</h3>
                <button className="text-gray-600 hover:text-gray-900">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart Component Here</p>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={\`px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }\`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Add Package import
const Package = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)`,
      'package.json': `{
  "name": "admin-dashboard",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "lucide-react": "^0.263.1"
  }
}`
    }
  }
]