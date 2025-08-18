'use client'

import { useRouter } from 'next/navigation'
import { Sparkles, Palette, Eye, Zap, Users, Download } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <Palette className="h-6 w-6" />,
      title: 'Full Canvas Editor',
      description:
        'Professional design tools with layers, history, and export options',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'AI Assistant',
      description:
        'Natural language commands to transform your designs instantly',
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Design Archaeology',
      description: 'Import any image and convert it to editable elements',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Performance Prediction',
      description: 'AI analyzes your design and predicts engagement metrics',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time',
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: 'Export Anywhere',
      description: 'Export as PNG, JPG, SVG, or JSON for any platform',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
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
                className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                Start Designing
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-5xl font-bold text-gray-900">
            Design with AI Superpowers
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
            Create stunning designs with natural language commands. Import any
            image and make it editable. Predict performance before you publish.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/editor/new')}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-white hover:bg-purple-700"
            >
              <Sparkles className="h-5 w-5" />
              Start Free Trial
            </button>
            <button
              onClick={() => router.push('/editor/new')}
              className="rounded-lg border border-gray-300 px-8 py-3 hover:bg-white"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="mb-12 text-center text-3xl font-bold">
            Everything you need to design like a pro
          </h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-50 p-6 transition hover:bg-gray-100"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  {feature.icon}
                </div>
                <h4 className="mb-2 text-lg font-semibold">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h3 className="mb-4 text-3xl font-bold">
            Ready to revolutionize your design workflow?
          </h3>
          <p className="mb-8 text-lg text-gray-600">
            Join thousands of designers using AI to create better designs
            faster.
          </p>
          <button
            onClick={() => router.push('/editor/new')}
            className="rounded-lg bg-purple-600 px-8 py-3 text-lg text-white hover:bg-purple-700"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
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
