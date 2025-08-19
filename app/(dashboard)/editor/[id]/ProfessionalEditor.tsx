'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  // Navigation
  ChevronLeft,
  Save,
  Download,
  Upload,
  Share2,
  
  // Tools
  MousePointer,
  Square,
  Circle,
  Triangle,
  Pentagon,
  Star,
  Minus,
  PenTool,
  Type,
  Image,
  
  // Transform
  Move,
  RotateCw,
  Maximize2,
  Copy,
  Trash2,
  
  // Alignment
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignTop,
  AlignCenterVertical,
  AlignBottom,
  
  // Layers
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  
  // Actions
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  
  // UI
  Settings,
  HelpCircle,
  Code2,
  Sparkles,
  Zap,
  Package,
  Palette,
  SlidersHorizontal,
  FileImage,
  Link,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Plus,
  ArrowUpDown,
  ArrowLeftRight,
  Loader2,
} from 'lucide-react'

// Dynamic imports
const FabricCanvas = dynamic(() => import('@/components/canvas/FabricCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  ),
})

interface ProfessionalEditorProps {
  designId: string
  initialData?: any
  onSave?: (data: any) => void
}

export default function ProfessionalEditor({ designId, initialData, onSave }: ProfessionalEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [fabric, setFabric] = useState<any>(null)
  
  // Tool states
  const [activeTool, setActiveTool] = useState('select')
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  
  // Panel states
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'layers' | 'ai'>('properties')
  const [showCodePanel, setShowCodePanel] = useState(false)
  
  // Properties
  const [fillColor, setFillColor] = useState('#9333ea')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [opacity, setOpacity] = useState(100)
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontWeight, setFontWeight] = useState('normal')
  const [fontStyle, setFontStyle] = useState('normal')
  const [textAlign, setTextAlign] = useState('left')
  const [lineHeight, setLineHeight] = useState(1.2)
  
  // History
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Load fabric.js
  useEffect(() => {
    import('fabric').then((module) => {
      setFabric(module.fabric)
    })
  }, [])

  // Initialize canvas
  useEffect(() => {
    if (!fabric || !canvasRef.current || canvas) return

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    // Event handlers
    newCanvas.on('selection:created', (e) => {
      setSelectedObjects(e.selected || [])
      updatePropertiesFromSelection(e.selected || [])
    })
    
    newCanvas.on('selection:updated', (e) => {
      setSelectedObjects(e.selected || [])
      updatePropertiesFromSelection(e.selected || [])
    })
    
    newCanvas.on('selection:cleared', () => {
      setSelectedObjects([])
    })

    newCanvas.on('object:modified', () => {
      saveToHistory(newCanvas)
      if (onSave) onSave(newCanvas.toJSON())
    })

    // Load initial data
    if (initialData) {
      newCanvas.loadFromJSON(initialData, () => {
        newCanvas.renderAll()
        saveToHistory(newCanvas)
      })
    } else {
      saveToHistory(newCanvas)
    }

    setCanvas(newCanvas)

    return () => {
      newCanvas.dispose()
    }
  }, [fabric, initialData])

  // Update properties from selection
  const updatePropertiesFromSelection = (objects: any[]) => {
    if (objects.length === 1) {
      const obj = objects[0]
      if (obj.fill) setFillColor(obj.fill)
      if (obj.stroke) setStrokeColor(obj.stroke)
      if (obj.strokeWidth) setStrokeWidth(obj.strokeWidth)
      if (obj.opacity !== undefined) setOpacity(obj.opacity * 100)
      
      if (obj.type === 'i-text' || obj.type === 'text') {
        if (obj.fontSize) setFontSize(obj.fontSize)
        if (obj.fontFamily) setFontFamily(obj.fontFamily)
        if (obj.fontWeight) setFontWeight(obj.fontWeight)
        if (obj.fontStyle) setFontStyle(obj.fontStyle)
        if (obj.textAlign) setTextAlign(obj.textAlign)
        if (obj.lineHeight) setLineHeight(obj.lineHeight)
      }
    }
  }

  // History management
  const saveToHistory = (fabricCanvas: any) => {
    const json = JSON.stringify(fabricCanvas.toJSON())
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(json)
    if (newHistory.length > 50) newHistory.shift()
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (!canvas || historyIndex <= 0) return
    const newIndex = historyIndex - 1
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }

  const redo = () => {
    if (!canvas || historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    canvas.loadFromJSON(history[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }

  // Tool functions
  const addRectangle = () => {
    if (!canvas || !fabric) return
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      width: 200,
      height: 100,
      rx: 8,
      ry: 8,
    })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addCircle = () => {
    if (!canvas || !fabric) return
    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      radius: 50,
    })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addTriangle = () => {
    if (!canvas || !fabric) return
    const triangle = new fabric.Triangle({
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      width: 100,
      height: 100,
    })
    canvas.add(triangle)
    canvas.setActiveObject(triangle)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addText = () => {
    if (!canvas || !fabric) return
    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      fill: fillColor,
      textAlign: textAlign,
      lineHeight: lineHeight,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const addLine = () => {
    if (!canvas || !fabric) return
    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    })
    canvas.add(line)
    canvas.setActiveObject(line)
    canvas.renderAll()
    saveToHistory(canvas)
  }

  const uploadImage = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabric || !canvas) return

    const reader = new FileReader()
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img: any) => {
        img.scaleToWidth(300)
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        saveToHistory(canvas)
      })
    }
    reader.readAsDataURL(file)
  }

  // Selection tools
  const deleteSelected = () => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      saveToHistory(canvas)
    }
  }

  const duplicateSelected = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned: any) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
        })
        if (cloned.type === 'activeSelection') {
          cloned.canvas = canvas
          cloned.forEachObject((obj: any) => canvas.add(obj))
        } else {
          canvas.add(cloned)
        }
        canvas.setActiveObject(cloned)
        canvas.renderAll()
        saveToHistory(canvas)
      })
    }
  }

  // Alignment
  const alignObjects = (type: string) => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 2) return

    let minLeft = Infinity, maxRight = -Infinity
    let minTop = Infinity, maxBottom = -Infinity

    activeObjects.forEach((obj: any) => {
      const bounds = obj.getBoundingRect()
      minLeft = Math.min(minLeft, bounds.left)
      maxRight = Math.max(maxRight, bounds.left + bounds.width)
      minTop = Math.min(minTop, bounds.top)
      maxBottom = Math.max(maxBottom, bounds.top + bounds.height)
    })

    activeObjects.forEach((obj: any) => {
      const bounds = obj.getBoundingRect()
      
      switch (type) {
        case 'left':
          obj.set({ left: obj.left - (bounds.left - minLeft) })
          break
        case 'center-h':
          const centerX = (minLeft + maxRight) / 2
          obj.set({ left: obj.left + (centerX - (bounds.left + bounds.width / 2)) })
          break
        case 'right':
          obj.set({ left: obj.left + (maxRight - (bounds.left + bounds.width)) })
          break
        case 'top':
          obj.set({ top: obj.top - (bounds.top - minTop) })
          break
        case 'center-v':
          const centerY = (minTop + maxBottom) / 2
          obj.set({ top: obj.top + (centerY - (bounds.top + bounds.height / 2)) })
          break
        case 'bottom':
          obj.set({ top: obj.top + (maxBottom - (bounds.top + bounds.height)) })
          break
      }
      obj.setCoords()
    })

    canvas.renderAll()
    saveToHistory(canvas)
  }

  // Distribute
  const distributeObjects = (direction: 'horizontal' | 'vertical') => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 3) return

    const sorted = [...activeObjects].sort((a, b) => {
      if (direction === 'horizontal') return a.left - b.left
      return a.top - b.top
    })

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    if (direction === 'horizontal') {
      const totalSpace = last.left - first.left
      const spacing = totalSpace / (sorted.length - 1)
      
      sorted.forEach((obj, i) => {
        if (i !== 0 && i !== sorted.length - 1) {
          obj.set({ left: first.left + spacing * i })
          obj.setCoords()
        }
      })
    } else {
      const totalSpace = last.top - first.top
      const spacing = totalSpace / (sorted.length - 1)
      
      sorted.forEach((obj, i) => {
        if (i !== 0 && i !== sorted.length - 1) {
          obj.set({ top: first.top + spacing * i })
          obj.setCoords()
        }
      })
    }

    canvas.renderAll()
    saveToHistory(canvas)
  }

  // Layer management
  const bringForward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringForward(activeObject)
      canvas.renderAll()
    }
  }

  const sendBackward = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendBackwards(activeObject)
      canvas.renderAll()
    }
  }

  const bringToFront = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringToFront(activeObject)
      canvas.renderAll()
    }
  }

  const sendToBack = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendToBack(activeObject)
      canvas.renderAll()
    }
  }

  // Apply properties to selected objects
  const applyToSelected = (property: string, value: any) => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    
    activeObjects.forEach((obj: any) => {
      obj.set(property, value)
    })
    
    canvas.renderAll()
    saveToHistory(canvas)
  }

  // Zoom controls
  const zoomIn = () => {
    if (!canvas) return
    const newZoom = Math.min(zoom + 10, 300)
    setZoom(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
  }

  const zoomOut = () => {
    if (!canvas) return
    const newZoom = Math.max(zoom - 10, 25)
    setZoom(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
  }

  const resetZoom = () => {
    if (!canvas) return
    setZoom(100)
    canvas.setZoom(1)
    canvas.renderAll()
  }

  // Export functions
  const exportAsPNG = () => {
    if (!canvas) return
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })
    const link = document.createElement('a')
    link.download = `design-${Date.now()}.png`
    link.href = dataURL
    link.click()
  }

  const exportAsJSON = () => {
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `design-${Date.now()}.json`
    link.href = url
    link.click()
  }

  // Analyze design for code generation
  const analyzeDesign = () => {
    if (!canvas) return
    setShowCodePanel(true)
    toast.success('Analyzing design for code generation...')
    // This would trigger the actual analysis
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        {/* Left Tools */}
        <div className="flex items-center gap-2">
          {/* Main Tools */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <button
              onClick={() => setActiveTool('select')}
              className={`p-2 rounded-lg transition-all ${
                activeTool === 'select' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
              }`}
              title="Select (V)"
            >
              <MousePointer className="h-4 w-4" />
            </button>
            <button
              onClick={addRectangle}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Rectangle (R)"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={addCircle}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Circle (O)"
            >
              <Circle className="h-4 w-4" />
            </button>
            <button
              onClick={addTriangle}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Triangle"
            >
              <Triangle className="h-4 w-4" />
            </button>
            <button
              onClick={addLine}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Line (L)"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={addText}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Text (T)"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={uploadImage}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Image"
            >
              <Image className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Edit Tools */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <button
              onClick={undo}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Undo (Ctrl+Z)"
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Redo (Ctrl+Y)"
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={duplicateSelected}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={deleteSelected}
              className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
              title="Delete (Del)"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Alignment Tools */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <button
              onClick={() => alignObjects('left')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('center-h')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Center"
            >
              <AlignCenterHorizontal className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('right')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('top')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Top"
            >
              <AlignTop className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('center-v')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Middle"
            >
              <AlignCenterVertical className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('bottom')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Align Bottom"
            >
              <AlignBottom className="h-4 w-4" />
            </button>
            <button
              onClick={() => distributeObjects('horizontal')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Distribute Horizontal"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => distributeObjects('vertical')}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Distribute Vertical"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* Layer Tools */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={bringToFront}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Bring to Front"
            >
              <Square className="h-4 w-4" style={{ transform: 'translateY(-2px)' }} />
            </button>
            <button
              onClick={bringForward}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Bring Forward"
            >
              <Square className="h-4 w-4" style={{ transform: 'translateY(-1px)' }} />
            </button>
            <button
              onClick={sendBackward}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Send Backward"
            >
              <Square className="h-4 w-4" style={{ transform: 'translateY(1px)' }} />
            </button>
            <button
              onClick={sendToBack}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Send to Back"
            >
              <Square className="h-4 w-4" style={{ transform: 'translateY(2px)' }} />
            </button>
          </div>
        </div>

        {/* Center - Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-gray-100"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1 rounded hover:bg-gray-100 text-sm font-medium"
          >
            {zoom}%
          </button>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-gray-100"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeDesign}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="h-4 w-4" />
            Design to Code
          </button>
          <button
            onClick={exportAsPNG}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Export as PNG"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={exportAsJSON}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Save Project"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          <div className="inline-block bg-white shadow-lg rounded-lg overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`flex-1 py-3 text-sm font-medium ${
                rightPanelTab === 'properties'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setRightPanelTab('layers')}
              className={`flex-1 py-3 text-sm font-medium ${
                rightPanelTab === 'layers'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setRightPanelTab('ai')}
              className={`flex-1 py-3 text-sm font-medium ${
                rightPanelTab === 'ai'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Assistant
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'properties' && (
              <div className="space-y-4">
                {/* Colors */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Colors</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Fill Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={fillColor}
                          onChange={(e) => {
                            setFillColor(e.target.value)
                            applyToSelected('fill', e.target.value)
                          }}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={fillColor}
                          onChange={(e) => {
                            setFillColor(e.target.value)
                            applyToSelected('fill', e.target.value)
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Stroke Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={strokeColor}
                          onChange={(e) => {
                            setStrokeColor(e.target.value)
                            applyToSelected('stroke', e.target.value)
                          }}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={strokeColor}
                          onChange={(e) => {
                            setStrokeColor(e.target.value)
                            applyToSelected('stroke', e.target.value)
                          }}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stroke & Opacity */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Stroke & Opacity</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Stroke Width: {strokeWidth}px</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={strokeWidth}
                        onChange={(e) => {
                          setStrokeWidth(Number(e.target.value))
                          applyToSelected('strokeWidth', Number(e.target.value))
                        }}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Opacity: {opacity}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => {
                          setOpacity(Number(e.target.value))
                          applyToSelected('opacity', Number(e.target.value) / 100)
                        }}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Typography (show only for text) */}
                {selectedObjects.length === 1 && 
                 (selectedObjects[0].type === 'i-text' || selectedObjects[0].type === 'text') && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Typography</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600">Font Family</label>
                        <select
                          value={fontFamily}
                          onChange={(e) => {
                            setFontFamily(e.target.value)
                            applyToSelected('fontFamily', e.target.value)
                          }}
                          className="w-full px-2 py-1 border rounded text-sm mt-1"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Font Size: {fontSize}px</label>
                        <input
                          type="range"
                          min="8"
                          max="120"
                          value={fontSize}
                          onChange={(e) => {
                            setFontSize(Number(e.target.value))
                            applyToSelected('fontSize', Number(e.target.value))
                          }}
                          className="w-full mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newWeight = fontWeight === 'bold' ? 'normal' : 'bold'
                            setFontWeight(newWeight)
                            applyToSelected('fontWeight', newWeight)
                          }}
                          className={`flex-1 p-2 rounded text-sm ${
                            fontWeight === 'bold' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
                          }`}
                        >
                          Bold
                        </button>
                        <button
                          onClick={() => {
                            const newStyle = fontStyle === 'italic' ? 'normal' : 'italic'
                            setFontStyle(newStyle)
                            applyToSelected('fontStyle', newStyle)
                          }}
                          className={`flex-1 p-2 rounded text-sm ${
                            fontStyle === 'italic' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'
                          }`}
                        >
                          Italic
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {rightPanelTab === 'layers' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Layers</h3>
                <div className="space-y-2">
                  {canvas?.getObjects().reverse().map((obj: any, index: number) => (
                    <div
                      key={index}
                      onClick={() => {
                        canvas.setActiveObject(obj)
                        canvas.renderAll()
                      }}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                        selectedObjects.includes(obj) ? 'bg-purple-100' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm">{obj.type}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            obj.set('visible', !obj.visible)
                            canvas.renderAll()
                          }}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          {obj.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            obj.set('selectable', !obj.selectable)
                            canvas.renderAll()
                          }}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          {obj.selectable !== false ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightPanelTab === 'ai' && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Assistant</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Use AI to help you design faster and better.
                  </p>
                  <textarea
                    placeholder="Describe what you want to create..."
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                    rows={4}
                  />
                  <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                    Generate with AI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Panel (slides up from bottom) */}
      {showCodePanel && (
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-white border-t border-gray-200 shadow-xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <h3 className="font-semibold">Generated Code</h3>
            <button
              onClick={() => setShowCodePanel(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 overflow-auto h-full">
            <pre className="text-sm text-gray-800">
              {`// React Component Generated from Design
export default function GeneratedComponent() {
  return (
    <div className="container">
      {/* Your design code here */}
    </div>
  )
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}