'use client'

import { useState, useEffect } from 'react'
import { VisualIntelligence } from '@/lib/canvas/visual-intelligence'
import { 
  Wand2, 
  Code2, 
  Rocket, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Zap,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import { toast } from 'sonner'

interface DesignToCodeBridgeProps {
  canvas: any // fabric.Canvas
  onDeploy?: (code: string) => void
}

export function DesignToCodeBridge({ canvas, onDeploy }: DesignToCodeBridgeProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  const [components, setComponents] = useState<any[]>([])
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)

  const analyzeDesign = async () => {
    if (!canvas) return
    
    setIsAnalyzing(true)
    try {
      // Use Visual Intelligence to analyze the canvas
      const vi = new VisualIntelligence(canvas)
      const detectedComponents = vi.analyzeDesign()
      const code = vi.generateReactApp()
      
      setComponents(detectedComponents)
      setGeneratedCode(code)
      
      toast.success(`Found ${detectedComponents.length} components!`)
    } catch (error) {
      toast.error('Failed to analyze design')
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const deployToProduction = async () => {
    if (!generatedCode) {
      toast.error('Please analyze your design first')
      return
    }

    // Create full Next.js app structure
    const files = {
      'app/page.tsx': generatedCode,
      'package.json': JSON.stringify({
        name: 'designer-app',
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: 'latest',
          react: 'latest',
          'react-dom': 'latest',
          'tailwindcss': 'latest'
        }
      }, null, 2),
      'tailwind.config.js': `
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}`,
      'next.config.js': `
module.exports = {
  reactStrictMode: true
}`
    }

    if (onDeploy) {
      onDeploy(JSON.stringify(files))
    }

    toast.success('Deploying to production...')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Action Button */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Design to Production
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`p-1.5 rounded ${previewMode === 'tablet' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Component Detection Results */}
        {components.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Detected Components:</div>
            <div className="flex flex-wrap gap-2">
              {components.map((comp, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                >
                  {comp.type}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={analyzeDesign}
            disabled={isAnalyzing}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Analyzing Design...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Analyze Design
              </>
            )}
          </button>

          {generatedCode && (
            <>
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Code2 className="h-4 w-4" />
                {showCode ? 'Hide' : 'Show'} Code
              </button>

              <button
                onClick={deployToProduction}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Rocket className="h-4 w-4" />
                Deploy to Production
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Code Preview */}
        {showCode && generatedCode && (
          <div className="mt-4 p-3 bg-gray-900 rounded-lg overflow-x-auto">
            <pre className="text-xs text-gray-300">
              <code>{generatedCode.slice(0, 500)}...</code>
            </pre>
          </div>
        )}

        {/* Smart Suggestions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-blue-900">Pro Tip</div>
              <div className="text-xs text-blue-700 mt-0.5">
                Group related elements to create reusable components
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Actions */}
      <div className="absolute -top-12 right-0 flex gap-2">
        <button className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </button>
      </div>
    </div>
  )
}