'use client'

import { useEffect, useRef, useState } from 'react'
import { MousePointer, Square, Circle, Type, Image, Trash2, Download, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SafeFabricEditorProps {
  designId?: string
  initialData?: any
  onCanvasReady?: (canvas: any) => void
  onSave?: (data: any) => void
}

export function SafeFabricEditor({
  designId,
  initialData,
  onCanvasReady,
  onSave
}: SafeFabricEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [fabric, setFabric] = useState<any>(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [currentColor, setCurrentColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('#9333ea')

  // Load fabric.js dynamically
  useEffect(() => {
    const loadFabric = async () => {
      try {
        const fabricModule = await import('fabric')
        setFabric(fabricModule)
      } catch (error) {
        console.error('Failed to load fabric.js:', error)
        toast.error('Failed to load design editor')
      }
    }
    loadFabric()
  }, [])

  // Initialize canvas safely
  useEffect(() => {
    if (!fabric || !canvasRef.current || canvas) return

    try {
      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      })

      // Only set basic properties that are guaranteed to exist
      if (fabric.Object && fabric.Object.prototype) {
        try {
          fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: '#9333ea',
            cornerStrokeColor: '#9333ea',
            borderColor: '#9333ea',
            cornerSize: 12,
            cornerStyle: 'circle',
          })
        } catch (e) {
          console.warn('Could not set custom object properties:', e)
        }
      }

      // Load initial data if provided
      if (initialData) {
        try {
          newCanvas.loadFromJSON(initialData, () => {
            newCanvas.renderAll()
          })
        } catch (e) {
          console.error('Failed to load initial data:', e)
        }
      }

      // Basic event handlers
      newCanvas.on('selection:created', (e) => {
        setSelectedObjects(e.selected || [])
      })
      
      newCanvas.on('selection:updated', (e) => {
        setSelectedObjects(e.selected || [])
      })
      
      newCanvas.on('selection:cleared', () => {
        setSelectedObjects([])
      })

      newCanvas.on('object:modified', () => {
        if (onSave) {
          try {
            onSave(newCanvas.toJSON())
          } catch (e) {
            console.error('Failed to save:', e)
          }
        }
      })

      setCanvas(newCanvas)
      if (onCanvasReady) onCanvasReady(newCanvas)

      return () => {
        try {
          newCanvas.dispose()
        } catch (e) {
          console.error('Failed to dispose canvas:', e)
        }
      }
    } catch (error) {
      console.error('Failed to initialize canvas:', error)
      toast.error('Failed to initialize design canvas')
    }
  }, [fabric, initialData, onCanvasReady, onSave])

  // Tool functions
  const addRectangle = () => {
    if (!canvas || !fabric) return
    try {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: fillColor,
        stroke: currentColor,
        strokeWidth: 2,
        width: 200,
        height: 100,
        rx: 5,
        ry: 5,
      })
      canvas.add(rect)
      canvas.setActiveObject(rect)
      canvas.renderAll()
    } catch (e) {
      console.error('Failed to add rectangle:', e)
    }
  }

  const addCircle = () => {
    if (!canvas || !fabric) return
    try {
      const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: fillColor,
        stroke: currentColor,
        strokeWidth: 2,
        radius: 50,
      })
      canvas.add(circle)
      canvas.setActiveObject(circle)
      canvas.renderAll()
    } catch (e) {
      console.error('Failed to add circle:', e)
    }
  }

  const addText = () => {
    if (!canvas || !fabric) return
    try {
      const text = new fabric.IText('Type here...', {
        left: 100,
        top: 100,
        fontFamily: 'Arial',
        fontSize: 24,
        fill: currentColor,
      })
      canvas.add(text)
      canvas.setActiveObject(text)
      canvas.renderAll()
    } catch (e) {
      console.error('Failed to add text:', e)
    }
  }

  const deleteSelected = () => {
    if (!canvas) return
    try {
      const activeObjects = canvas.getActiveObjects()
      if (activeObjects.length > 0) {
        activeObjects.forEach((obj: any) => canvas.remove(obj))
        canvas.discardActiveObject()
        canvas.renderAll()
      }
    } catch (e) {
      console.error('Failed to delete objects:', e)
    }
  }

  const downloadCanvas = () => {
    if (!canvas) return
    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      })
      const link = document.createElement('a')
      link.download = `design-${Date.now()}.png`
      link.href = dataURL
      link.click()
    } catch (e) {
      console.error('Failed to download canvas:', e)
      toast.error('Failed to download image')
    }
  }

  const saveDesign = () => {
    if (!canvas || !onSave) return
    try {
      const data = canvas.toJSON()
      onSave(data)
      toast.success('Design saved')
    } catch (e) {
      console.error('Failed to save design:', e)
      toast.error('Failed to save design')
    }
  }

  if (!fabric) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 p-2 space-y-2">
        <button
          onClick={() => setCurrentTool('select')}
          className={`w-full p-3 rounded ${
            currentTool === 'select' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
          }`}
          title="Select"
        >
          <MousePointer className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={addRectangle}
          className="w-full p-3 rounded hover:bg-gray-100"
          title="Rectangle"
        >
          <Square className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={addCircle}
          className="w-full p-3 rounded hover:bg-gray-100"
          title="Circle"
        >
          <Circle className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={addText}
          className="w-full p-3 rounded hover:bg-gray-100"
          title="Text"
        >
          <Type className="h-5 w-5 mx-auto" />
        </button>
        
        <div className="border-t pt-2">
          <button
            onClick={deleteSelected}
            disabled={selectedObjects.length === 0}
            className="w-full p-3 rounded hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-5 w-5 mx-auto" />
          </button>
        </div>
        
        <div className="border-t pt-2">
          <button
            onClick={saveDesign}
            className="w-full p-3 rounded hover:bg-green-50 hover:text-green-600"
            title="Save"
          >
            <Save className="h-5 w-5 mx-auto" />
          </button>
          
          <button
            onClick={downloadCanvas}
            className="w-full p-3 rounded hover:bg-blue-50 hover:text-blue-600"
            title="Download"
          >
            <Download className="h-5 w-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-50 overflow-auto p-8">
        <div className="inline-block shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fill Color</label>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => {
                setFillColor(e.target.value)
                if (selectedObjects.length > 0) {
                  selectedObjects.forEach(obj => {
                    obj.set('fill', e.target.value)
                  })
                  canvas?.renderAll()
                }
              }}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Stroke Color</label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value)
                if (selectedObjects.length > 0) {
                  selectedObjects.forEach(obj => {
                    obj.set('stroke', e.target.value)
                  })
                  canvas?.renderAll()
                }
              }}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}