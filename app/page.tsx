'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Rocket, 
  Zap, 
  ArrowRight, 
  Play,
  Globe,
  Smartphone,
  Monitor,
  Database,
  ShoppingBag,
  Palette,
  MousePointer,
  Code2,
  Layers,
  Package,
  Star,
  Users,
  TrendingUp,
  Check,
  X
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [activeDemo, setActiveDemo] = useState('design')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const stats = [
    { value: '10min', label: 'Design to Deploy' },
    { value: '0', label: 'Lines of Code' },
    { value: '100%', label: 'Visual Design' },
    { value: '70%', label: 'Seller Commission' },
  ]

  const workflow = [
    {
      step: '01',
      title: 'Design Visually',
      description: 'Use our intuitive canvas to create stunning interfaces',
      icon: <Palette className="h-6 w-6" />,
    },
    {
      step: '02',
      title: 'AI Converts to Code',
      description: 'Our AI instantly transforms your design into production React code',
      icon: <Sparkles className="h-6 w-6" />,
    },
    {
      step: '03',
      title: 'Deploy Instantly',
      description: 'One-click deploy to Vercel, Netlify, or your own hosting',
      icon: <Rocket className="h-6 w-6" />,
    },
  ]

  const comparisons = [
    { feature: 'Visual design to production', us: true, others: false },
    { feature: 'No coding required', us: true, others: false },
    { feature: 'AI pattern recognition', us: true, others: false },
    { feature: 'Visual database design', us: true, others: false },
    { feature: 'Auto-responsive layouts', us: true, others: false },
    { feature: 'Component marketplace', us: true, others: false },
    { feature: 'Instant deployment', us: true, others: true },
    { feature: 'Real-time collaboration', us: true, others: true },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Designer',
      company: 'Design Studio',
      quote: "Finally! I can ship my designs without waiting for developers. Game changer.",
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    {
      name: 'Alex Rivera',
      role: 'Freelance Designer',
      company: 'Self-employed',
      quote: "Turned my Dribbble shots into real apps. Making $5K/month from component sales!",
      avatar: 'https://i.pravatar.cc/150?u=alex',
    },
    {
      name: 'Mike Johnson',
      role: 'Design Lead',
      company: 'StartupCo',
      quote: "We prototype and ship 10x faster. No more design-to-dev handoff issues.",
      avatar: 'https://i.pravatar.cc/150?u=mike',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 text-center text-sm">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          New: Visual Database Designer - Design your backend without SQL
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur-lg opacity-60" />
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-2">
                  <Layers className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DesignShip</h1>
                <p className="text-xs text-gray-600">Ship Apps Without Code</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => router.push('/templates')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Templates
              </button>
              <button 
                onClick={() => router.push('/marketplace')}
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Marketplace
              </button>
              <button className="text-gray-700 hover:text-gray-900 font-medium">
                Pricing
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/editor/new')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:shadow-lg transition-all flex items-center gap-2"
              >
                Start Designing
                <ArrowRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50" />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, purple 0%, transparent 50%), radial-gradient(circle at 80% 20%, blue 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-purple-600" />
              For Designers Who Want to Ship Real Apps
            </div>

            {/* Main Heading */}
            <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Design It. Ship It.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                No Code Required.
              </span>
            </h2>

            {/* Subheading */}
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              Turn your Figma designs into production apps in minutes. 
              AI converts your visual designs into React code instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => router.push('/editor/new')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-semibold text-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Rocket className="h-5 w-5" />
                Start Free Trial
              </button>
              <button className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold text-lg hover:border-gray-400 transition-all flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Watch 3-min Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              See It In Action
            </h3>
            <p className="text-xl text-gray-600">
              Watch how designs become apps in real-time
            </p>
          </div>

          {/* Demo Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {['design', 'convert', 'deploy'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDemo(tab)}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  activeDemo === tab
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Demo Content */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                {activeDemo === 'design' && (
                  <div className="text-center">
                    <MousePointer className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Visual Design</h4>
                    <p className="text-gray-600">Drag, drop, and style your components</p>
                  </div>
                )}
                {activeDemo === 'convert' && (
                  <div className="text-center">
                    <Code2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">AI Converts</h4>
                    <p className="text-gray-600">Instantly generates production React code</p>
                  </div>
                )}
                {activeDemo === 'deploy' && (
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Deploy Live</h4>
                    <p className="text-gray-600">One-click to production on Vercel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              From Design to Production in 3 Steps
            </h3>
            <p className="text-xl text-gray-600">
              No developers needed. No waiting. Just ship.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {workflow.map((item, i) => (
              <div key={i} className="relative">
                {/* Connection Line */}
                {i < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-300 to-blue-300" />
                )}
                
                <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-400 transition-all hover:shadow-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                      {item.icon}
                    </div>
                    <span className="text-3xl font-bold text-gray-300">{item.step}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Designers Need to Ship
            </h3>
            <p className="text-xl text-gray-600">
              Built for designers, not developers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <MousePointer className="h-6 w-6" />,
                title: 'Visual-First Design',
                description: 'Design exactly what you want to see. No abstraction.',
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: 'AI Pattern Recognition',
                description: 'Automatically detects buttons, forms, cards from your design.',
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: 'Auto-Responsive',
                description: 'Designs adapt perfectly to mobile, tablet, and desktop.',
              },
              {
                icon: <Database className="h-6 w-6" />,
                title: 'Visual Database Design',
                description: 'Design your database visually. No SQL knowledge needed.',
              },
              {
                icon: <Package className="h-6 w-6" />,
                title: 'Component Marketplace',
                description: 'Sell your components. Earn 70% commission.',
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Instant Deploy',
                description: 'One-click deploy to Vercel, Netlify, or custom hosting.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Why Designers Choose DesignShip
            </h3>
            <p className="text-xl text-gray-600">
              We're built different. For designers, by designers.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="text-left px-6 py-4">Feature</th>
                  <th className="px-6 py-4">DesignShip</th>
                  <th className="px-6 py-4">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {item.us ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.others ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Designers Are Shipping Real Apps
            </h3>
            <p className="text-xl text-gray-600">
              Join thousands who've ditched the dev handoff
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-white mb-6">
            Stop Waiting for Developers
          </h3>
          <p className="text-xl text-purple-100 mb-8">
            Ship your designs today. No code. No delays. Just results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/editor/new')}
              className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-purple-700 text-white rounded-full font-semibold text-lg hover:bg-purple-800 transition-all flex items-center justify-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              View Templates
            </button>
          </div>
          <p className="mt-6 text-purple-200 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-6 w-6" />
                <span className="font-bold text-xl">DesignShip</span>
              </div>
              <p className="text-gray-400 text-sm">
                The platform where designers ship production apps without code.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white">Templates</button></li>
                <li><button className="hover:text-white">Marketplace</button></li>
                <li><button className="hover:text-white">Pricing</button></li>
                <li><button className="hover:text-white">Roadmap</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white">Documentation</button></li>
                <li><button className="hover:text-white">Tutorials</button></li>
                <li><button className="hover:text-white">Blog</button></li>
                <li><button className="hover:text-white">Community</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button className="hover:text-white">About</button></li>
                <li><button className="hover:text-white">Careers</button></li>
                <li><button className="hover:text-white">Contact</button></li>
                <li><button className="hover:text-white">Terms</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2024 DesignShip. Ship apps without code.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}