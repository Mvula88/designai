'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, Palette, Eye, Zap, Users, Download } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Full Canvas Editor',
      description: 'Professional design tools with layers, history, and export options'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI Assistant',
      description: 'Natural language commands to transform your designs instantly'
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Design Archaeology',
      description: 'Import any image and convert it to editable elements'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance Prediction',
      description: 'AI analyzes your design and predicts engagement metrics'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Export Anywhere',
      description: 'Export as PNG, JPG, SVG, or JSON for any platform'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">DesignOS</h1>
            </div>
            <nav className="flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/editor/new')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start Designing
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Design with AI Superpowers
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create stunning designs with natural language commands. 
            Import any image and make it editable. Predict performance before you publish.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/editor/new')}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Free Trial
            </button>
            <button
              onClick={() => router.push('/editor/new')}
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-white"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">
            Everything you need to design like a pro
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to revolutionize your design workflow?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of designers using AI to create better designs faster.
          </p>
          <button
            onClick={() => router.push('/editor/new')}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-lg"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span className="font-semibold">DesignOS</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2024 DesignOS. Powered by Claude AI & Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}