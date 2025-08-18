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
} from 'lucide-react'
import { toast } from 'sonner'
import AIPlayground from '@/components/playground/AIPlayground'
import IntegrationsPanel from '@/components/playground/IntegrationsPanel'
import DeploymentStatus from '@/components/playground/DeploymentStatus'

// Dynamically import Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/playground/CodeEditor'), {
  ssr: false,
})

const PreviewFrame = dynamic(
  () => import('@/components/playground/PreviewFrame'),
  { ssr: false }
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
  const [playground, setPlayground] = useState<Playground | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState<any>({})
  const [selectedFile, setSelectedFile] = useState('app/page.tsx')
  const [previewDevice, setPreviewDevice] = useState<
    'desktop' | 'tablet' | 'mobile'
  >('desktop')
  const [showChat, setShowChat] = useState(true)
  const [showIntegrations, setShowIntegrations] = useState(false)
  const [showDeployment, setShowDeployment] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [promptHistory, setPromptHistory] = useState<any[]>([])
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
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">Welcome to your app!</h1>
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!playground) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Playground not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/playground')}
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-500" />
            <input
              type="text"
              value={playground.name}
              onChange={(e) =>
                setPlayground({ ...playground, name: e.target.value })
              }
              className="bg-transparent text-white outline-none"
              onBlur={savePlayground}
            />
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggles */}
          <div className="flex items-center rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`rounded p-1.5 ${
                previewDevice === 'desktop'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400'
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`rounded p-1.5 ${
                previewDevice === 'tablet'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400'
              }`}
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`rounded p-1.5 ${
                previewDevice === 'mobile'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400'
              }`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={deployToGitHub}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
          >
            <Github className="h-4 w-4" />
            Push to GitHub
          </button>
          <button
            onClick={deployToVercel}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-sm text-white hover:from-violet-700 hover:to-purple-700"
          >
            <Cloud className="h-4 w-4" />
            Deploy
          </button>
          <button
            onClick={() => setShowIntegrations(!showIntegrations)}
            className={`rounded-lg p-1.5 ${
              showIntegrations
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Key className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className={`rounded-lg p-1.5 ${
              showChat
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* AI Chat Panel */}
        {showChat && (
          <div className="w-96 border-r border-gray-800">
            <AIPlayground
              onPromptSubmit={handlePromptSubmit}
              isGenerating={isGenerating}
              promptHistory={promptHistory}
              integrations={integrations}
            />
          </div>
        )}

        {/* Code Editor */}
        <div className="flex flex-1 flex-col">
          <CodeEditor
            files={code}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onCodeChange={(file, newCode) => {
              setCode({ ...code, [file]: newCode })
            }}
          />
        </div>

        {/* Preview */}
        <div className="flex flex-1 flex-col border-l border-gray-800 bg-white">
          <PreviewFrame
            code={code}
            device={previewDevice}
            playgroundId={playground.id}
          />
        </div>

        {/* Integrations Panel */}
        {showIntegrations && (
          <div className="w-80 border-l border-gray-800">
            <IntegrationsPanel
              playgroundId={playground.id}
              integrations={integrations}
              onIntegrationsChange={loadIntegrations}
            />
          </div>
        )}

        {/* Deployment Status */}
        {showDeployment && (
          <div className="absolute bottom-4 right-4">
            <DeploymentStatus playgroundId={playground.id} />
          </div>
        )}
      </div>
    </div>
  )
}
