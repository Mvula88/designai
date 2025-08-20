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
  Save,
  Settings,
  FolderOpen,
  FileCode2,
  Layout,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  Package,
  GitBranch,
  HelpCircle,
  Edit3,
  Crown,
  CreditCard,
  Activity,
  Plus,
  Globe,
  FileArchive,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import AIPlayground from '@/components/playground/AIPlayground'
import IntegrationsPanel from '@/components/playground/IntegrationsPanel'
import DeploymentStatus from '@/components/playground/DeploymentStatus'
import LiveEditOverlay from '@/components/playground/LiveEditOverlay'
import PricingPlans from '@/components/playground/PricingPlans'
import StripeConnect from '@/components/playground/StripeConnect'
import ZipUpload from '@/components/playground/ZipUpload'

// Dynamically import Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/playground/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-950">
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
    </div>
  )
})

const PreviewFrame = dynamic(
  () => import('@/components/playground/PreviewFrame'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-white">
        <Layout className="h-8 w-8 text-gray-400" />
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
  const [activePanel, setActivePanel] = useState<'ai' | 'stripe' | 'files' | 'integrations' | null>(null)
  const [fullscreenPreview, setFullscreenPreview] = useState(false)
  const [liveEditMode, setLiveEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [showPricing, setShowPricing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showZipUpload, setShowZipUpload] = useState(false)
  
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
      setCode(data.current_code || {
        'app/page.tsx': `export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-4">
          Welcome to Your App
        </h1>
        <p className="text-xl text-center text-gray-600">
          Start building with AI assistance
        </p>
      </div>
    </div>
  )
}`,
        'package.json': `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0"
  }
}`
      })
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
      setCode(data.code)

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
    const mainFile = 'app/page.tsx'
    if (code[mainFile]) {
      const updatedCode = { ...code }
      setCode(updatedCode)
      toast.success('Element updated')
    }
  }

  const handleZipFilesExtracted = async (extractedFiles: Record<string, string>) => {
    // Merge extracted files with existing code
    const updatedCode = { ...code, ...extractedFiles }
    
    // Update state immediately
    setCode(updatedCode)
    
    // Open files panel to show imported files
    setActivePanel('files')
    
    // Select the first file if available
    const firstFile = Object.keys(extractedFiles)[0]
    if (firstFile) {
      setSelectedFile(firstFile)
    }
    
    // Save the updated code to the database
    try {
      const { error } = await supabase
        .from('playgrounds')
        .update({
          current_code: updatedCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playground?.id)

      if (error) throw error
      
      setLastSaved(new Date())
      toast.success(`Imported ${Object.keys(extractedFiles).length} files successfully`)
      
      // Force a refresh of the playground data
      setTimeout(() => {
        loadPlayground()
      }, 500)
    } catch (error) {
      console.error('Failed to save imported files:', error)
      toast.error('Failed to save imported files')
    }
  }

  const deployToGitHub = async () => {
    const githubIntegration = integrations.find(i => i.service_type === 'github')
    if (!githubIntegration) {
      toast.error('Please connect GitHub first')
      setActivePanel('integrations')
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
      setPreviewUrl(data.deploymentUrl)
      window.open(data.deploymentUrl, '_blank')
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
          <button
            onClick={() => router.push('/playground')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Playgrounds
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Top Bar with All Controls */}
        <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4">
            {/* Left Section - Logo and Project Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/playground')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </button>
              
              <div className="h-6 w-px bg-gray-700" />
              
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
                  <Code2 className="h-4 w-4 text-white" />
                </div>
                <input
                  type="text"
                  value={playground.name}
                  onChange={(e) => setPlayground({ ...playground, name: e.target.value })}
                  className="text-lg font-semibold bg-transparent text-white outline-none"
                  onBlur={savePlayground}
                />
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-300 text-xs rounded-full border border-purple-600/30">
                    {playground.framework}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-600/30">
                    {playground.language}
                  </span>
                </div>
                {saving && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
                    <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                    <span className="text-xs text-gray-400">Saving...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Section - Device Preview */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewDevice === 'tablet'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Tablet Preview"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Section - All Tools and Actions */}
            <div className="flex items-center gap-2">
              {/* Panel Toggles */}
              <button
                onClick={() => setActivePanel(activePanel === 'files' ? null : 'files')}
                className={`p-2 rounded-lg transition-all ${
                  activePanel === 'files'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="File Explorer"
              >
                <FolderOpen className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
                className={`p-2 rounded-lg transition-all ${
                  activePanel === 'ai'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="AI Assistant"
              >
                <Sparkles className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'stripe' ? null : 'stripe')}
                className={`p-2 rounded-lg transition-all ${
                  activePanel === 'stripe'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Stripe Payments"
              >
                <CreditCard className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'integrations' ? null : 'integrations')}
                className={`p-2 rounded-lg transition-all ${
                  activePanel === 'integrations'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Integrations"
              >
                <Key className="h-4 w-4" />
              </button>

              <div className="h-6 w-px bg-gray-700" />

              {/* Import/Export Actions */}
              <button
                onClick={() => setShowZipUpload(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="Import from ZIP"
              >
                <FileArchive className="h-4 w-4" />
              </button>

              <div className="h-6 w-px bg-gray-700" />

              {/* Actions */}
              <button
                onClick={() => setLiveEditMode(!liveEditMode)}
                className={`p-2 rounded-lg transition-all ${
                  liveEditMode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title="Live Edit Mode"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              <button
                onClick={savePlayground}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="Save (Ctrl+S)"
              >
                <Save className="h-4 w-4" />
              </button>

              <button
                onClick={deployToGitHub}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                title="Push to GitHub"
              >
                <Github className="h-4 w-4" />
              </button>

              <button
                onClick={deployToVercel}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg shadow-purple-600/25"
                title="Deploy to Production"
              >
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Deploy</span>
              </button>

              <div className="h-6 w-px bg-gray-700" />

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
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Cleaner Design */}
          {activePanel && (
            <aside className="w-80 border-r border-gray-800 bg-gray-900/50 flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  {activePanel === 'ai' && <><Sparkles className="h-4 w-4 text-purple-400" /> AI Assistant</>}
                  {activePanel === 'stripe' && <><CreditCard className="h-4 w-4 text-green-400" /> Stripe Payments</>}
                  {activePanel === 'files' && <><FolderOpen className="h-4 w-4 text-blue-400" /> File Explorer</>}
                  {activePanel === 'integrations' && <><Key className="h-4 w-4 text-yellow-400" /> Integrations</>}
                </h3>
                <button
                  onClick={() => setActivePanel(null)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                {activePanel === 'ai' && (
                  <AIPlayground
                    onPromptSubmit={handlePromptSubmit}
                    isGenerating={isGenerating}
                    promptHistory={promptHistory}
                    integrations={integrations}
                  />
                )}
                
                {activePanel === 'stripe' && (
                  <div className="p-4">
                    <StripeConnect
                      playgroundId={playground.id}
                      onClose={() => setActivePanel(null)}
                    />
                  </div>
                )}
                
                {activePanel === 'files' && (
                  <div className="p-4 space-y-1">
                    {Object.keys(code).map((fileName) => (
                      <button
                        key={fileName}
                        onClick={() => setSelectedFile(fileName)}
                        className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-all flex items-center gap-2 ${
                          selectedFile === fileName
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                        }`}
                      >
                        <FileCode2 className="h-4 w-4" />
                        {fileName}
                      </button>
                    ))}
                    <button className="w-full px-3 py-2 text-left text-sm rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 flex items-center gap-2">
                      <span className="text-lg leading-none">+</span>
                      Add File
                    </button>
                  </div>
                )}
                
                {activePanel === 'integrations' && (
                  <IntegrationsPanel
                    playgroundId={playground.id}
                    integrations={integrations}
                    onIntegrationsChange={loadIntegrations}
                  />
                )}
              </div>
            </aside>
          )}

          {/* Code Editor */}
          <div className="flex-1 flex flex-col bg-gray-950">
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
            </div>
            
            <div className="flex-1">
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
                  onClick={() => setFullscreenPreview(!fullscreenPreview)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-600"
                >
                  {fullscreenPreview ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
                <button className="p-1 rounded hover:bg-gray-200 text-gray-600">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-gray-200 text-gray-600">
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
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
        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Ready
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {Object.keys(code).length} files
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              main
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {lastSaved && (
              <span className="flex items-center gap-1 text-green-500">
                <Check className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button className="hover:text-white">
              <HelpCircle className="h-3 w-3" />
            </button>
          </div>
        </footer>
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <PricingPlans
          onClose={() => setShowPricing(false)}
          playgroundId={playground.id}
        />
      )}

      {/* ZIP Upload Modal */}
      {showZipUpload && (
        <ZipUpload
          onFilesExtracted={handleZipFilesExtracted}
          onClose={() => setShowZipUpload(false)}
        />
      )}
    </div>
  )
}