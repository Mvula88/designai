'use client'

import { useState, useEffect } from 'react'
import { AdvancedFabricEditor } from '@/components/canvas/AdvancedFabricEditor'
import { ClaudeAssistant } from '@/components/ai/ClaudeAssistant'
import { VisionAnalyzer } from '@/components/ai/VisionAnalyzer'
import { DesignToCodeBridge } from '@/components/canvas/DesignToCodeBridge'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const designId = params.id as string
  const [canvas, setCanvas] = useState<any>(null)
  const [designData, setDesignData] = useState<any>(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'assistant' | 'import'>(
    'assistant'
  )
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Load design data
  useEffect(() => {
    if (designId && designId !== 'new') {
      loadDesign()
    }
  }, [designId])

  const loadDesign = async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single()

    if (data) {
      setDesignData(data)
    } else if (error) {
      toast.error('Failed to load design')
    }
  }

  const handleCanvasReady = (fabricCanvas: any) => {
    setCanvas(fabricCanvas)
  }

  const handleCanvasSave = async (canvasData: any) => {
    if (!designId || designId === 'new') return

    setSaving(true)
    const { error } = await supabase
      .from('designs')
      .update({
        canvas_data: canvasData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)

    setSaving(false)
    if (error) {
      toast.error('Failed to save design')
    }
  }

  const applyAIAnalysis = (fabricObjects: any[]) => {
    if (!canvas) return

    fabricObjects.forEach((obj) => {
      // Create fabric objects from the analysis
      if (obj.type === 'rect') {
        const rect = new (window as any).fabric.Rect(obj)
        canvas.add(rect)
      } else if (obj.type === 'circle') {
        const circle = new (window as any).fabric.Circle(obj)
        canvas.add(circle)
      } else if (obj.type === 'i-text') {
        const text = new (window as any).fabric.IText(obj.text || 'Text', obj)
        canvas.add(text)
      }
    })

    canvas.renderAll()
    toast.success('AI design applied to canvas')
  }

  const executeAICommand = (command: any) => {
    if (!canvas) return

    // Execute fabric.js commands from Claude
    command.fabricCommands?.forEach((cmd: any) => {
      try {
        const objects = canvas.getActiveObjects()
        if (objects.length > 0) {
          objects.forEach((obj: any) => {
            if (cmd.method === 'set' && cmd.args) {
              obj.set(cmd.args[0])
            }
          })
        } else {
          // Apply to canvas if no objects selected
          if (cmd.method === 'setBackgroundColor' && cmd.args) {
            canvas.setBackgroundColor(cmd.args[0], () => canvas.renderAll())
          }
        }
      } catch (error) {
        console.error('Failed to execute command:', error)
      }
    })

    canvas.renderAll()
    toast.success('AI command applied')
  }

  const handleDeploy = async (filesJson: string) => {
    try {
      // Save the design first
      if (designId && designId !== 'new') {
        await handleCanvasSave(canvas.toJSON())
      }

      // Create a playground from the design
      const { data: playground, error } = await supabase
        .from('playgrounds')
        .insert({
          name: designData?.title || 'Deployed Design',
          description: 'Auto-generated from visual design',
          current_code: JSON.parse(filesJson),
          framework: 'nextjs',
          language: 'typescript',
          styling: 'tailwind',
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (error) throw error

      // Navigate to playground for deployment
      router.push(`/playground/${playground.id}`)
      toast.success('Ready to deploy! Connect your GitHub/Vercel account.')
    } catch (error) {
      console.error('Deployment error:', error)
      toast.error('Failed to prepare deployment')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-1 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold">
            {designData?.title || 'Untitled Design'}
          </h1>
          {saving && <span className="text-sm text-gray-500">Saving...</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="flex items-center gap-1 rounded border px-3 py-1 text-sm hover:bg-gray-100"
          >
            {rightPanelOpen ? (
              <>
                Hide AI Panel
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Show AI Panel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Editor */}
        <div className="flex-1 relative">
          <AdvancedFabricEditor
            designId={designId}
            initialData={designData?.canvas_data}
            onCanvasReady={handleCanvasReady}
            onSave={handleCanvasSave}
          />
          
          {/* Design to Code Bridge - Floating UI */}
          {canvas && (
            <DesignToCodeBridge 
              canvas={canvas}
              onDeploy={handleDeploy}
            />
          )}
        </div>

        {/* AI Panel */}
        {rightPanelOpen && (
          <div className="flex w-96 flex-col border-l border-gray-200 bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex border-b bg-white">
              <button
                onClick={() => setActiveTab('assistant')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'assistant'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'import'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Import Design
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'assistant' && (
                <ClaudeAssistant canvas={canvas} onCommand={executeAICommand} />
              )}

              {activeTab === 'import' && (
                <VisionAnalyzer onAnalysisComplete={applyAIAnalysis} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
