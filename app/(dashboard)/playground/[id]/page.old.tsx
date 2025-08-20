'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ChevronLeft,
  Smartphone,
  Tablet,
  Monitor,
  Loader2,
  Github,
  Cloud,
  Key,
  Code2,
  MessageSquare,
  Save,
  Play,
  Settings,
  FolderOpen,
  FileCode2,
  Layout,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Upload,
  Share2,
  Zap,
  Terminal,
  Package,
  GitBranch,
  HelpCircle,
  MoreVertical,
  Edit3,
  Crown,
  CreditCard,
  ChevronRight,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import AIPlayground from '@/components/playground/AIPlayground'
import IntegrationsPanel from '@/components/playground/IntegrationsPanel'
import DeploymentStatus from '@/components/playground/DeploymentStatus'
import LiveEditOverlay from '@/components/playground/LiveEditOverlay'
import PricingPlans from '@/components/playground/PricingPlans'
import StripeConnect from '@/components/playground/StripeConnect'

// Dynamically import Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/playground/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-950">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">Loading editor...</p>
      </div>
    </div>
  )
})

const PreviewFrame = dynamic(
  () => import('@/components/playground/PreviewFrame'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <Layout className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Loading preview...</p>
        </div>
      </div>
    )
  }
)

interface Playground {
  id: string
  name: string
  description: string
  current_code: any
  framework: string
  language: string
  styling: string
  prompt_history: any[]
  settings: any
}

interface Integration {
  id: string
  service_type: string
  status: string
  config: any
}

export default function PlaygroundEditorPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  // Core state
  const [playground, setPlayground] = useState<Playground | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState<any>({})
  const [selectedFile, setSelectedFile] = useState('app/page.tsx')
  
  // UI state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showChat, setShowChat] = useState(true)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [showDeployment, setShowDeployment] = useState(false)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [fullscreenPreview, setFullscreenPreview] = useState(false)
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark')
  const [liveEditMode, setLiveEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [showStripeConnect, setShowStripeConnect] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePanel, setActivePanel] = useState<'ai' | 'stripe' | 'files' | null>('ai')
  
  // Integration state
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [promptHistory, setPromptHistory] = useState<any[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const autoSaveTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadPlayground()
    loadIntegrations()
  }, [params.id])

  useEffect(() => {
    // Auto-save on code changes
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current)
    }
    autoSaveTimeout.current = setTimeout(() => {
      if (playground && code !== playground.current_code) {
        savePlayground()
      }
    }, 2000)

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current)
      }
    }
  }, [code])

  const loadPlayground = async () => {
    try {
      const { data, error } = await supabase
        .from('playgrounds')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setPlayground(data)
      setCode(
        data.current_code || {
          'app/page.tsx': `export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to DesignShip
        </h1>
        <p className="text-xl text-center text-gray-600">
          Start building your app with AI assistance
        </p>
      </div>
    </div>
  )
}`,
          'package.json': `{
  "name": "designship-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "tailwindcss": "^3.4.0"
  }
}`,
        }
      )
      setPromptHistory(data.prompt_history || [])
    } catch (error) {
      console.error('Failed to load playground:', error)
      toast.error('Failed to load playground')
      router.push('/playground')
    } finally {
      setLoading(false)
    }
  }

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('playground_integrations')
        .select('*')
        .eq('playground_id', params.id)

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Failed to load integrations:', error)
    }
  }

  const savePlayground = async () => {
    if (!playground) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('playgrounds')
        .update({
          current_code: code,
          prompt_history: promptHistory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playground.id)

      if (error) throw error
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save playground:', error)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          playgroundId: playground?.id,
          currentCode: code,
          framework: playground?.framework,
          language: playground?.language,
          styling: playground?.styling,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()

      // Update code with generated files
      setCode(data.code)

      // Add to prompt history
      const newHistoryItem = {
        prompt,
        response: data.explanation,
        timestamp: new Date().toISOString(),
      }
      setPromptHistory([...promptHistory, newHistoryItem])

      toast.success('Code generated successfully!')
    } catch (error) {
      console.error('Failed to generate code:', error)
      toast.error('Failed to generate code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLiveEdit = (elementPath: string, changes: any) => {
    // Apply live edits to the code
    const mainFile = 'app/page.tsx'
    if (code[mainFile]) {
      // Here you would implement the logic to update the specific element in the code
      // This is a simplified version
      const updatedCode = { ...code }
      // Apply changes to the element at the specified path
      // This would require parsing and updating the JSX/TSX
      setCode(updatedCode)
      toast.success('Element updated')
    }
  }

  const deployToGitHub = async () => {
    const githubIntegration = integrations.find(
      (i) => i.service_type === 'github'
    )
    if (!githubIntegration) {
      toast.error('Please connect GitHub first')
      setShowIntegrations(true)
      return
    }

    try {
      const response = await fetch('/api/playground/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playgroundId: playground?.id,
          deploymentType: 'github',
          code,
        }),
      })

      if (!response.ok) throw new Error('Deployment failed')

      const data = await response.json()
      toast.success(`Deployed to GitHub: ${data.repoUrl}`)
      setShowDeployment(true)
    } catch (error) {
      console.error('Failed to deploy:', error)
      toast.error('Failed to deploy to GitHub')
    }
  }

  const deployToVercel = async () => {
    try {
      const response = await fetch('/api/playground/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playgroundId: playground?.id,
          deploymentType: 'vercel',
          code,
        }),
      })

      if (!response.ok) throw new Error('Deployment failed')

      const data = await response.json()
      toast.success('Deploying to Vercel...')
      window.open(data.deploymentUrl, '_blank')
      setShowDeployment(true)
    } catch (error) {
      console.error('Failed to deploy:', error)
      toast.error('Failed to deploy to Vercel')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 animate-pulse" />
            <Code2 className="relative h-16 w-16 text-white mb-4" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Playground</h2>
          <p className="text-gray-400">Setting up your development environment...</p>
        </div>
      </div>
    )
  }

  if (!playground) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Playground Not Found</h2>
          <p className="text-gray-400 mb-4">The requested playground does not exist</p>
          <button
            onClick={() => router.push('/playground')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Playgrounds
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      {/* Professional Header Bar */}
      <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/playground')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="h-6 w-px bg-gray-700" />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-50" />
                <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-1.5">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={playground.name}
                  onChange={(e) => setPlayground({ ...playground, name: e.target.value })}
                  className="bg-transparent text-white font-semibold outline-none text-sm"
                  onBlur={savePlayground}
                />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{playground.framework}</span>
                  <span>•</span>
                  <span>{playground.language}</span>
                  {lastSaved && (
                    <>
                      <span>•</span>
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {saving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
                <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                <span className="text-xs text-gray-400">Saving...</span>
              </div>
            )}
          </div>

          {/* Center Section - Device Preview */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Desktop Preview"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  previewDevice === 'tablet'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Tablet Preview"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Mobile Preview"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiveEditMode(!liveEditMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                liveEditMode
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
              title="Toggle Live Edit Mode"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">Live Edit</span>
            </button>
            
            <button
              onClick={() => savePlayground()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
              title="Save (Ctrl+S)"
            >
              <Save className="h-4 w-4" />
              <span className="text-sm">Save</span>
            </button>
            
            <button
              onClick={deployToGitHub}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
              title="Push to GitHub"
            >
              <Github className="h-4 w-4" />
              <span className="text-sm">Push</span>
            </button>
            
            <button
              onClick={deployToVercel}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-500/25"
              title="Deploy to Production"
            >
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Deploy</span>
            </button>
            
            <div className="h-6 w-px bg-gray-700 mx-2" />
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowIntegrations(!showIntegrations)}
                className={`p-2 rounded-lg transition-all ${
                  showIntegrations
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Integrations"
              >
                <Key className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg transition-all ${
                  showChat
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="AI Assistant"
              >
                <Sparkles className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowPricing(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="Upgrade Plan"
              >
                <Crown className="h-4 w-4" />
              </button>
              
              <button
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Professional Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* AI Assistant Panel */}
        {showChat && (
          <aside className="w-80 border-r border-gray-800 bg-gray-900/50 flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Assistant
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Ask me to help you build your app
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIPlayground
                onPromptSubmit={handlePromptSubmit}
                isGenerating={isGenerating}
                promptHistory={promptHistory}
                integrations={integrations}
              />
            </div>
          </aside>
        )}

        {/* Code Editor Section */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {/* File Tabs */}
          <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-2 gap-1 overflow-x-auto">
            {Object.keys(code).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all flex items-center gap-2 ${
                  selectedFile === fileName
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <FileCode2 className="h-3 w-3" />
                {fileName}
              </button>
            ))}
            <button
              className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all"
              title="Add file"
            >
              <span className="text-sm">+</span>
            </button>
          </div>
          
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              files={code}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              onCodeChange={(file, newCode) => {
                setCode({ ...code, [file]: newCode })
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className={`${fullscreenPreview ? 'fixed inset-0 z-50' : 'flex-1'} flex flex-col bg-white`}>
          {/* Preview Header */}
          <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-gray-600 ml-2">
                Preview • {previewDevice}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setFullscreenPreview(!fullscreenPreview)}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title={fullscreenPreview ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreenPreview ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-50 relative">
            <PreviewFrame
              code={code}
              device={previewDevice}
              playgroundId={playground.id}
            />
            {liveEditMode && (
              <LiveEditOverlay
                isActive={liveEditMode}
                onToggle={() => setLiveEditMode(!liveEditMode)}
                onElementEdit={handleLiveEdit}
                selectedElement={selectedElement}
              />
            )}
          </div>
        </div>

        {/* Integrations Panel */}
        {showIntegrations && (
          <aside className="w-80 border-l border-gray-800 bg-gray-900/50">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-blue-500" />
                  Integrations
                </h3>
                <button
                  onClick={() => setShowIntegrations(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <IntegrationsPanel
              playgroundId={playground.id}
              integrations={integrations}
              onIntegrationsChange={loadIntegrations}
            />
          </aside>
        )}
      </div>

      {/* Deployment Status Popup */}
      {showDeployment && (
        <div className="fixed bottom-4 right-4 z-40">
          <DeploymentStatus playgroundId={playground.id} />
        </div>
      )}

      {/* Status Bar */}
      <footer className="h-6 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-4 text-gray-400">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {playground.framework}
          </span>
          <span className="flex items-center gap-1">
            <FileCode2 className="h-3 w-3" />
            {Object.keys(code).length} files
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            main
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          {saving ? (
            <span className="flex items-center gap-1 text-yellow-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="h-3 w-3" />
              All changes saved
            </span>
          )}
          <button className="hover:text-white">
            <HelpCircle className="h-3 w-3" />
          </button>
        </div>
      </footer>

      {/* Pricing Modal */}
      {showPricing && (
        <PricingPlans
          onClose={() => setShowPricing(false)}
          playgroundId={playground.id}
        />
      )}
    </div>
  )
}