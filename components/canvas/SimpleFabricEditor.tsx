'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  MousePointer,
  Square,
  Circle,
  Type,
  Image,
  Minus,
  PenTool,
  Trash2,
  Copy,
  Download,
  Save,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SimpleFabricEditorProps {
  designId?: string
  initialData?: any
  onSave?: (data: any) => void
  onCanvasReady?: (canvas: any) => void
}

export function SimpleFabricEditor({
  designId,
  initialData,
  onSave,
  onCanvasReady,
}: SimpleFabricEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [fabric, setFabric] = useState<any>(null)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [currentColor, setCurrentColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fontSize, setFontSize] = useState(24)
  const supabase = createClient()

  // Load fabric.js
  useEffect(() => {
    import('fabric').then((module) => {
      setFabric(module)
    })
  }, [])

  // Initialize canvas
  useEffect(() => {
    if (!fabric || !canvasRef.current || canvas) return

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: true,
    })

    // Load initial data if provided
    if (initialData) {
      newCanvas.loadFromJSON(initialData, () => {
        newCanvas.renderAll()
      })
    }

    setCanvas(newCanvas)
    
    if (onCanvasReady) {
      onCanvasReady(newCanvas)
    }

    return () => {
      newCanvas.dispose()
    }
  }, [fabric])

  // Auto-save
  useEffect(() => {
    if (!canvas || !designId) return

    const saveTimer = setInterval(() => {
      const data = canvas.toJSON()
      if (onSave) {
        onSave(data)
      }
      
      // Save to Supabase
      supabase
        .from('designs')
        .update({ canvas_data: data })
        .eq('id', designId)
        .then(() => {
          console.log('Auto-saved')
        })
    }, 10000) // Save every 10 seconds

    return () => clearInterval(saveTimer)
  }, [canvas, designId, onSave])

  // Tool handlers
  const addRectangle = useCallback(() => {
    if (!canvas || !fabric) return
    
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: currentColor,
      strokeWidth: strokeWidth,
      stroke: '#000000',
    })
    
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }, [canvas, fabric, currentColor, strokeWidth])

  const addCircle = useCallback(() => {
    if (!canvas || !fabric) return
    
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: currentColor,
      strokeWidth: strokeWidth,
      stroke: '#000000',
    })
    
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }, [canvas, fabric, currentColor, strokeWidth])

  const addText = useCallback(() => {
    if (!canvas || !fabric) return
    
    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: currentColor,
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }, [canvas, fabric, fontSize, currentColor])

  const deleteSelected = useCallback(() => {
    if (!canvas) return
    
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => {
        canvas.remove(obj)
      })
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }, [canvas])

  const clearCanvas = useCallback(() => {
    if (!canvas) return
    canvas.clear()
    canvas.backgroundColor = '#ffffff'
    canvas.renderAll()
  }, [canvas])

  const downloadCanvas = useCallback(() => {
    if (!canvas) return
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
    })
    
    const link = document.createElement('a')
    link.download = 'design.png'
    link.href = dataURL
    link.click()
  }, [canvas])

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCurrentColor(color)
    
    if (canvas) {
      const activeObjects = canvas.getActiveObjects()
      activeObjects.forEach((obj: any) => {
        if (obj.type === 'i-text' || obj.type === 'text') {
          obj.set('fill', color)
        } else {
          obj.set('fill', color)
        }
      })
      canvas.renderAll()
    }
  }, [canvas])

  if (!fabric) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 p-2 space-y-2">
        <button
          onClick={() => setSelectedTool('select')}
          className={`p-2 rounded ${selectedTool === 'select' ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
          title="Select"
        >
          <MousePointer className="h-5 w-5" />
        </button>
        
        <button
          onClick={addRectangle}
          className="p-2 rounded hover:bg-gray-100"
          title="Rectangle"
        >
          <Square className="h-5 w-5" />
        </button>
        
        <button
          onClick={addCircle}
          className="p-2 rounded hover:bg-gray-100"
          title="Circle"
        >
          <Circle className="h-5 w-5" />
        </button>
        
        <button
          onClick={addText}
          className="p-2 rounded hover:bg-gray-100"
          title="Text"
        >
          <Type className="h-5 w-5" />
        </button>
        
        <hr className="my-2" />
        
        <button
          onClick={deleteSelected}
          className="p-2 rounded hover:bg-gray-100 text-red-600"
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        
        <button
          onClick={downloadCanvas}
          className="p-2 rounded hover:bg-gray-100"
          title="Download"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-64 bg-white border-l border-gray-200 p-4">
        <h3 className="font-semibold mb-4">Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <input
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Stroke Width: {strokeWidth}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <button
            onClick={clearCanvas}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  )
}