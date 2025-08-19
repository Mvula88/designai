'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ClaudeAssistant } from '@/components/ai/ClaudeAssistant'
import { VisionAnalyzer } from '@/components/ai/VisionAnalyzer'
import DesignImportModal from '@/components/import/DesignImportModal'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, ChevronRight, ChevronUp, Upload, FileImage, 
  MousePointer, Square, Circle, Type, PenTool, Image, 
  Undo, Redo, Copy, Trash, Download, Save, Code,
  Move, RotateCw, Maximize2, Minus, Triangle, Star,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Layers, Lock, Unlock, Eye, EyeOff, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'

// Dynamic imports with error boundaries
const AdvancedFabricEditor = dynamic(
  () => import('@/components/canvas/AdvancedFabricEditor').then(mod => mod.AdvancedFabricEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design editor...</p>
        </div>
      </div>
    )
  }
)

const FigmaLikeToolbar = dynamic(
  () => import('@/components/canvas/FigmaLikeToolbar').then(mod => mod.FigmaLikeToolbar),
  { ssr: false }
)

const DesignToCodeBridge = dynamic(
  () => import('@/components/canvas/DesignToCodeBridge').then(mod => mod.DesignToCodeBridge),
  { ssr: false }
)

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const designId = params.id as string
  const [canvas, setCanvas] = useState<any>(null)
  const [fabric, setFabric] = useState<any>(null)
  const [designData, setDesignData] = useState<any>(null)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [codePanel, setCodePanel] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [activeTab, setActiveTab] = useState<'assistant' | 'import'>('assistant')
  const [saving, setSaving] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const supabase = createClient()

  // Load fabric.js
  useEffect(() => {
    const loadFabric = async () => {
      const fabricLib = (window as any).fabric
      if (fabricLib) {
        setFabric(fabricLib)
      }
    }
    loadFabric()
  }, [])

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
    } else {
      toast.success('Design saved')
    }
  }

  // Tool functions
  const addShape = (shapeType: string) => {
    if (!canvas || !fabric) return

    let shape
    const center = canvas.getCenter()

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          left: center.left - 50,
          top: center.top - 50,
          width: 100,
          height: 100,
          fill: '#9333ea',
          strokeWidth: 0,
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: center.left - 50,
          top: center.top - 50,
          radius: 50,
          fill: '#3b82f6',
          strokeWidth: 0,
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
          left: center.left - 50,
          top: center.top - 60,
          width: 100,
          height: 100,
          fill: '#10b981',
          strokeWidth: 0,
        })
        break
      case 'line':
        shape = new fabric.Line([center.left - 50, center.top, center.left + 50, center.top], {
          stroke: '#000',
          strokeWidth: 2,
        })
        break
      case 'text':
        shape = new fabric.IText('Type here', {
          left: center.left - 50,
          top: center.top - 20,
          fontSize: 24,
          fill: '#000',
        })
        break
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !fabric) return
    
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string
      fabric.Image.fromURL(imgUrl, (img: any) => {
        const center = canvas.getCenter()
        img.set({
          left: center.left - (img.width * 0.5) / 2,
          top: center.top - (img.height * 0.5) / 2,
          scaleX: 0.5,
          scaleY: 0.5,
        })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
  }

  const deleteSelected = () => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      toast.success('Deleted')
    }
  }

  const duplicateSelected = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    activeObject.clone((cloned: any) => {
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
      })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
    })
  }

  const handleUndo = () => {
    if (!canvas) return
    // Implement undo logic
    toast.info('Undo action')
  }

  const handleRedo = () => {
    if (!canvas) return
    // Implement redo logic
    toast.info('Redo action')
  }

  const applyAIAnalysis = (fabricObjects: any[]) => {
    if (!canvas || !fabric) return

    fabricObjects.forEach((obj) => {
      if (obj.type === 'rect') {
        const rect = new fabric.Rect(obj)
        canvas.add(rect)
      } else if (obj.type === 'circle') {
        const circle = new fabric.Circle(obj)
        canvas.add(circle)
      } else if (obj.type === 'i-text') {
        const text = new fabric.IText(obj.text || 'Text', obj)
        canvas.add(text)
      }
    })

    canvas.renderAll()
    toast.success('AI design applied to canvas')
  }

  const handleImportDesign = (importedData: any) => {
    if (importedData.fabricObjects) {
      applyAIAnalysis(importedData.fabricObjects)
    } else if (importedData.imageUrl && canvas && fabric) {
      fabric.Image.fromURL(importedData.imageUrl, (img: any) => {
        canvas.add(img)
        canvas.renderAll()
      })
    }
    setShowImportModal(false)
    toast.success('Design imported successfully!')
  }

  const executeAICommand = (command: any) => {
    if (!canvas) return

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
      if (designId && designId !== 'new') {
        await handleCanvasSave(canvas.toJSON())
      }

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

      router.push(`/playground/${playground.id}`)
      toast.success('Ready to deploy! Connect your GitHub/Vercel account.')
    } catch (error) {
      console.error('Deployment error:', error)
      toast.error('Failed to prepare deployment')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          
          {/* Main Tools */}
          <div className="flex items-center gap-1 border-l border-gray-700 pl-4">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded ${activeTool === 'select' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
              title="Select (V)"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTool('move')}
              className={`p-2 rounded ${activeTool === 'move' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
              title="Move"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={() => addShape('rect')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Rectangle (R)"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={() => addShape('circle')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Circle (O)"
            >
              <Circle className="h-4 w-4" />
            </button>
            <button
              onClick={() => addShape('triangle')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Triangle"
            >
              <Triangle className="h-4 w-4" />
            </button>
            <button
              onClick={() => addShape('line')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Line (L)"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded ${activeTool === 'pen' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
              title="Pen (P)"
            >
              <PenTool className="h-4 w-4" />
            </button>
            <button
              onClick={() => addShape('text')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Text (T)"
            >
              <Type className="h-4 w-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-700 mx-1" />
            
            {/* Edit Tools */}
            <button
              onClick={handleUndo}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={duplicateSelected}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={deleteSelected}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Delete"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {designData?.title || 'Untitled Design'}
          </span>
          {saving && <span className="text-xs text-gray-500">Saving...</span>}
          
          <div className="h-6 w-px bg-gray-700 mx-2" />
          
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="p-2 rounded text-gray-400 hover:bg-gray-800"
            title="Toggle Advanced Tools"
          >
            <Layers className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
          >
            <Upload className="h-4 w-4" />
            Import Design
          </button>
          
          <button
            onClick={() => setCodePanel(!codePanel)}
            className="flex items-center gap-2 rounded bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-sm text-white hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Design to Code
          </button>
          
          <button
            onClick={() => handleCanvasSave(canvas?.toJSON())}
            className="p-2 rounded text-gray-400 hover:bg-gray-800"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="p-2 rounded text-gray-400 hover:bg-gray-800"
            title="Toggle AI Panel"
          >
            {rightPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel - Advanced Tools */}
        {leftPanelOpen && canvas && fabric && (
          <FigmaLikeToolbar canvas={canvas} fabric={fabric} />
        )}

        {/* Canvas Editor */}
        <div className="flex-1 relative bg-gray-100">
          <AdvancedFabricEditor
            designId={designId}
            initialData={designData?.canvas_data}
            onCanvasReady={handleCanvasReady}
            onSave={handleCanvasSave}
          />
          
          {/* Image Upload Input (Hidden) */}
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Floating Upload Button */}
          <button
            onClick={() => document.getElementById('image-upload')?.click()}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
            title="Upload Image"
          >
            <Image className="h-5 w-5" />
          </button>
        </div>

        {/* Right Panel - AI Assistant */}
        {rightPanelOpen && (
          <div className="flex w-96 flex-col border-l border-gray-800 bg-gray-900">
            <div className="flex border-b border-gray-800 bg-gray-900">
              <button
                onClick={() => setActiveTab('assistant')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'assistant'
                    ? 'border-b-2 border-purple-600 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-3 text-sm font-medium ${
                  activeTab === 'import'
                    ? 'border-b-2 border-purple-600 text-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Vision Analyzer
              </button>
            </div>

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

        {/* Bottom Code Panel - Collapsible */}
        {codePanel && canvas && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 transition-all duration-300"
               style={{ height: '40vh', zIndex: 50 }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-300">Design to Production</h3>
              <button
                onClick={() => setCodePanel(false)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            <div className="h-full overflow-auto">
              <DesignToCodeBridge 
                canvas={canvas}
                onDeploy={handleDeploy}
              />
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <DesignImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportDesign}
      />
    </div>
  )
}