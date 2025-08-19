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
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Bold,
  Italic,
  Underline,
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Palette,
  Pipette,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Grid3x3,
  Maximize,
  Package,
  Star,
  Heart,
  Triangle,
  Hexagon,
  Pentagon,
  Sparkles,
  Upload,
  Link2,
  Unlink,
  BringToFront,
  SendToBack,
  ScanLine,
  Brush,
  Eraser,
  Hand,
  RectangleHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings,
  Sliders,
  Paintbrush,
  GalleryVertical,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { HexColorPicker } from 'react-colorful'

interface AdvancedFabricEditorProps {
  designId?: string
  initialData?: any
  onSave?: (data: any) => void
  onCanvasReady?: (canvas: any) => void
}

export function AdvancedFabricEditor({
  designId,
  initialData,
  onSave,
  onCanvasReady,
}: AdvancedFabricEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [fabric, setFabric] = useState<any>(null)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [currentColor, setCurrentColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [opacity, setOpacity] = useState(100)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [gridSize, setGridSize] = useState(20)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showLayers, setShowLayers] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [gradientMode, setGradientMode] = useState(false)
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowOptions, setShadowOptions] = useState({
    color: 'rgba(0,0,0,0.3)',
    blur: 10,
    offsetX: 5,
    offsetY: 5,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Available fonts
  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
    'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS',
    'Arial Black', 'Palatino', 'Garamond', 'Bookman', 'Tahoma'
  ]

  // Load fabric.js
  useEffect(() => {
    import('fabric').then((module) => {
      setFabric(module)
    })
  }, [])

  // Initialize canvas with advanced features
  useEffect(() => {
    if (!fabric || !canvasRef.current || canvas) return

    const newCanvas = new fabric.Canvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      enableRetinaScaling: true,
      controlsAboveOverlay: true,
      allowTouchScrolling: true,
      imageSmoothingEnabled: true,
      // Selection styles
      selectionColor: 'rgba(147, 51, 234, 0.1)',
      selectionBorderColor: '#9333ea',
      selectionLineWidth: 2,
      selectionDashArray: [5, 5],
    })

    // Enhanced object controls - check if fabric is fully loaded
    if (fabric.Object && fabric.Object.prototype) {
      fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#9333ea',
        cornerStrokeColor: '#9333ea',
        borderColor: '#9333ea',
        cornerSize: 12,
        cornerStyle: 'circle',
        borderScaleFactor: 2,
        borderOpacityWhenMoving: 0.5,
        borderDashArray: [5, 5],
        padding: 5,
        lockScalingFlip: true,
        centeredScaling: false,
        centeredRotation: true,
      })

      // Add custom controls - ensure controls object exists
      if (fabric.Control && fabric.Object.prototype.controls) {
        fabric.Object.prototype.controls.deleteControl = new fabric.Control({
          x: 0.5,
          y: -0.5,
          offsetY: -16,
          offsetX: 16,
          cursorStyle: 'pointer',
          mouseUpHandler: (eventData, target) => {
            const canvas = target.canvas
            if (canvas) {
              canvas.remove(target)
              canvas.requestRenderAll()
            }
            return true
          },
          render: (ctx, left, top) => {
            ctx.save()
            ctx.translate(left, top)
            ctx.rotate(fabric.util.degreesToRadians(45))
            ctx.fillStyle = '#ef4444'
            ctx.fillRect(-8, -8, 16, 16)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(-4, 0)
            ctx.lineTo(4, 0)
            ctx.moveTo(0, -4)
            ctx.lineTo(0, 4)
            ctx.stroke()
            ctx.restore()
          },
        })
      }
    }

    // Load initial data
    if (initialData) {
      newCanvas.loadFromJSON(initialData, () => {
        newCanvas.renderAll()
        saveToHistory(newCanvas)
      })
    } else {
      saveToHistory(newCanvas)
    }

    // Event handlers
    newCanvas.on('selection:created', (e) => {
      setSelectedObjects(e.selected || [])
      updatePropertiesPanel(e.selected || [])
    })
    
    newCanvas.on('selection:updated', (e) => {
      setSelectedObjects(e.selected || [])
      updatePropertiesPanel(e.selected || [])
    })
    
    newCanvas.on('selection:cleared', () => {
      setSelectedObjects([])
    })

    newCanvas.on('object:modified', () => {
      saveToHistory(newCanvas)
      if (onSave) onSave(newCanvas.toJSON())
    })

    newCanvas.on('object:added', () => {
      saveToHistory(newCanvas)
      if (onSave) onSave(newCanvas.toJSON())
    })

    // Keyboard shortcuts - create handler function
    const keyHandler = (e: KeyboardEvent) => handleKeyPress(e, newCanvas)
    document.addEventListener('keydown', keyHandler)

    setCanvas(newCanvas)
    if (onCanvasReady) onCanvasReady(newCanvas)

    return () => {
      document.removeEventListener('keydown', keyHandler)
      newCanvas.dispose()
    }
  }, [fabric])

  // Update properties panel when objects are selected
  const updatePropertiesPanel = (objects: any[]) => {
    if (objects.length === 1) {
      const obj = objects[0]
      if (obj.fill) setFillColor(obj.fill)
      if (obj.stroke) setCurrentColor(obj.stroke)
      if (obj.strokeWidth) setStrokeWidth(obj.strokeWidth)
      if (obj.fontSize) setFontSize(obj.fontSize)
      if (obj.fontFamily) setFontFamily(obj.fontFamily)
      if (obj.opacity !== undefined) setOpacity(obj.opacity * 100)
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

  const undo = useCallback(() => {
    if (!canvas || historyIndex <= 0) return
    
    const newIndex = historyIndex - 1
    canvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }, [canvas, history, historyIndex])

  const redo = useCallback(() => {
    if (!canvas || historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    canvas.loadFromJSON(JSON.parse(history[newIndex]), () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }, [canvas, history, historyIndex])

  // Keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent, fabricCanvas: any) => {
    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      redo()
    }
    // Delete: Remove selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      deleteSelected()
    }
    // Ctrl/Cmd + C: Copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault()
      copySelected()
    }
    // Ctrl/Cmd + V: Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault()
      paste()
    }
    // Ctrl/Cmd + A: Select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault()
      selectAll()
    }
    // Ctrl/Cmd + D: Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault()
      duplicateSelected()
    }
    // Ctrl/Cmd + G: Group
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault()
      groupSelected()
    }
    // Ctrl/Cmd + Shift + G: Ungroup
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
      e.preventDefault()
      ungroupSelected()
    }
  }, [])

  // Shape tools
  const addShape = useCallback((type: string) => {
    if (!canvas || !fabric) return

    let shape: any
    const center = canvas.getCenter()

    switch (type) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: center.left - 50,
          top: center.top - 50,
          width: 100,
          height: 100,
          fill: fillColor,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
      
      case 'circle':
        shape = new fabric.Circle({
          left: center.left - 50,
          top: center.top - 50,
          radius: 50,
          fill: fillColor,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
      
      case 'triangle':
        shape = new fabric.Triangle({
          left: center.left - 50,
          top: center.top - 50,
          width: 100,
          height: 100,
          fill: fillColor,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
      
      case 'line':
        shape = new fabric.Line([0, 0, 200, 0], {
          left: center.left - 100,
          top: center.top,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
      
      case 'polygon':
        const points = [
          { x: 0, y: -50 },
          { x: 50, y: -15 },
          { x: 30, y: 40 },
          { x: -30, y: 40 },
          { x: -50, y: -15 },
        ]
        shape = new fabric.Polygon(points, {
          left: center.left,
          top: center.top,
          fill: fillColor,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
      
      case 'star':
        const starPoints = []
        const outerRadius = 50
        const innerRadius = 25
        const numPoints = 5
        
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (Math.PI * i) / numPoints
          starPoints.push({
            x: Math.sin(angle) * radius,
            y: -Math.cos(angle) * radius,
          })
        }
        
        shape = new fabric.Polygon(starPoints, {
          left: center.left,
          top: center.top,
          fill: fillColor,
          stroke: currentColor,
          strokeWidth: strokeWidth,
        })
        break
    }

    if (shape) {
      if (shadowEnabled) {
        shape.setShadow(shadowOptions)
      }
      
      shape.set({ opacity: opacity / 100 })
      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
    }
  }, [canvas, fabric, fillColor, currentColor, strokeWidth, opacity, shadowEnabled, shadowOptions])

  // Text tools
  const addText = useCallback((type: 'normal' | 'heading' | 'subheading' = 'normal') => {
    if (!canvas || !fabric) return

    const sizes = {
      normal: 24,
      heading: 48,
      subheading: 32,
    }

    const text = new fabric.IText('Click to edit text', {
      left: canvas.getCenter().left,
      top: canvas.getCenter().top,
      fontSize: sizes[type],
      fontFamily: fontFamily,
      fill: currentColor,
      textAlign: 'left',
      originX: 'center',
      originY: 'center',
    })

    if (shadowEnabled) {
      text.setShadow(shadowOptions)
    }

    text.set({ opacity: opacity / 100 })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    text.enterEditing()
    text.selectAll()
  }, [canvas, fabric, fontFamily, currentColor, opacity, shadowEnabled, shadowOptions])

  // Image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canvas || !fabric) return

    const reader = new FileReader()
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img: any) => {
        const scale = Math.min(400 / (img.width || 1), 400 / (img.height || 1))
        img.scale(scale)
        img.set({
          left: canvas.getCenter().left,
          top: canvas.getCenter().top,
          originX: 'center',
          originY: 'center',
        })
        
        if (shadowEnabled) {
          img.setShadow(shadowOptions)
        }
        
        img.set({ opacity: opacity / 100 })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
  }, [canvas, fabric, opacity, shadowEnabled, shadowOptions])

  // Selection tools
  const selectAll = useCallback(() => {
    if (!canvas) return
    canvas.discardActiveObject()
    const selection = new fabric.ActiveSelection(canvas.getObjects(), { canvas })
    canvas.setActiveObject(selection)
    canvas.renderAll()
  }, [canvas, fabric])

  const deleteSelected = useCallback(() => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }, [canvas])

  // Copy/Paste
  const [clipboard, setClipboard] = useState<any>(null)

  const copySelected = useCallback(() => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      activeObject.clone((cloned: any) => {
        setClipboard(cloned)
        toast.success('Copied to clipboard')
      })
    }
  }, [canvas])

  const paste = useCallback(() => {
    if (!canvas || !clipboard) return
    
    clipboard.clone((clonedObj: any) => {
      canvas.discardActiveObject()
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      })
      
      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas
        clonedObj.forEachObject((obj: any) => {
          canvas.add(obj)
        })
        clonedObj.setCoords()
      } else {
        canvas.add(clonedObj)
      }
      
      clipboard.top += 10
      clipboard.left += 10
      canvas.setActiveObject(clonedObj)
      canvas.requestRenderAll()
    })
  }, [canvas, clipboard])

  const duplicateSelected = useCallback(() => {
    copySelected()
    setTimeout(paste, 100)
  }, [copySelected, paste])

  // Alignment tools
  const alignObjects = useCallback((alignment: string) => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    const canvasWidth = canvas.getWidth()
    const canvasHeight = canvas.getHeight()

    switch (alignment) {
      case 'left':
        activeObject.set({ left: 0 })
        break
      case 'center-h':
        activeObject.set({ left: canvasWidth / 2 - activeObject.width * activeObject.scaleX / 2 })
        break
      case 'right':
        activeObject.set({ left: canvasWidth - activeObject.width * activeObject.scaleX })
        break
      case 'top':
        activeObject.set({ top: 0 })
        break
      case 'center-v':
        activeObject.set({ top: canvasHeight / 2 - activeObject.height * activeObject.scaleY / 2 })
        break
      case 'bottom':
        activeObject.set({ top: canvasHeight - activeObject.height * activeObject.scaleY })
        break
    }

    activeObject.setCoords()
    canvas.renderAll()
  }, [canvas])

  // Layer management
  const bringForward = useCallback(() => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringForward(activeObject)
      canvas.renderAll()
    }
  }, [canvas])

  const sendBackward = useCallback(() => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendBackwards(activeObject)
      canvas.renderAll()
    }
  }, [canvas])

  const bringToFront = useCallback(() => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringToFront(activeObject)
      canvas.renderAll()
    }
  }, [canvas])

  const sendToBack = useCallback(() => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendToBack(activeObject)
      canvas.renderAll()
    }
  }, [canvas])

  // Group/Ungroup
  const groupSelected = useCallback(() => {
    if (!canvas || !fabric) return
    const activeObject = canvas.getActiveObject()
    
    if (activeObject && activeObject.type === 'activeSelection') {
      const group = activeObject.toGroup()
      canvas.setActiveObject(group)
      canvas.renderAll()
      toast.success('Objects grouped')
    }
  }, [canvas, fabric])

  const ungroupSelected = useCallback(() => {
    if (!canvas || !fabric) return
    const activeObject = canvas.getActiveObject()
    
    if (activeObject && activeObject.type === 'group') {
      const items = activeObject.getObjects()
      activeObject.ungroupOnCanvas()
      
      const selection = new fabric.ActiveSelection(items, { canvas })
      canvas.setActiveObject(selection)
      canvas.renderAll()
      toast.success('Group ungrouped')
    }
  }, [canvas, fabric])

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!canvas) return
    const newZoom = Math.min(zoom + 10, 300)
    setZoom(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
  }, [canvas, zoom])

  const zoomOut = useCallback(() => {
    if (!canvas) return
    const newZoom = Math.max(zoom - 10, 25)
    setZoom(newZoom)
    canvas.setZoom(newZoom / 100)
    canvas.renderAll()
  }, [canvas, zoom])

  const resetZoom = useCallback(() => {
    if (!canvas) return
    setZoom(100)
    canvas.setZoom(1)
    canvas.renderAll()
  }, [canvas])

  // Export functions
  const exportAsJSON = useCallback(() => {
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON())
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'design.json'
    link.href = url
    link.click()
  }, [canvas])

  const exportAsPNG = useCallback(() => {
    if (!canvas) return
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })
    const link = document.createElement('a')
    link.download = 'design.png'
    link.href = dataURL
    link.click()
  }, [canvas])

  const exportAsSVG = useCallback(() => {
    if (!canvas) return
    const svg = canvas.toSVG()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'design.svg'
    link.href = url
    link.click()
  }, [canvas])

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return
    if (confirm('Clear all objects from canvas?')) {
      canvas.clear()
      canvas.backgroundColor = '#ffffff'
      canvas.renderAll()
      saveToHistory(canvas)
    }
  }, [canvas])

  // Update selected objects properties
  const updateSelectedObjects = useCallback((property: string, value: any) => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    
    activeObjects.forEach((obj: any) => {
      obj.set(property, value)
    })
    
    canvas.renderAll()
  }, [canvas])

  if (!fabric) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Toolbar - Tools */}
      <div className="w-16 bg-gray-900 p-2 space-y-1 overflow-y-auto">
        {/* Selection Tools */}
        <button
          onClick={() => setSelectedTool('select')}
          className={`p-2 rounded w-full ${selectedTool === 'select' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Select (V)"
        >
          <MousePointer className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => setSelectedTool('pan')}
          className={`p-2 rounded w-full ${selectedTool === 'pan' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Pan (H)"
        >
          <Hand className="h-5 w-5 mx-auto" />
        </button>

        <hr className="border-gray-700" />

        {/* Shape Tools */}
        <button
          onClick={() => addShape('rectangle')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Rectangle (R)"
        >
          <Square className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => addShape('circle')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Circle (C)"
        >
          <Circle className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => addShape('triangle')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Triangle"
        >
          <Triangle className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => addShape('star')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Star"
        >
          <Star className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => addShape('polygon')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Polygon"
        >
          <Pentagon className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => addShape('line')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Line (L)"
        >
          <Minus className="h-5 w-5 mx-auto" />
        </button>

        <hr className="border-gray-700" />

        {/* Text Tools */}
        <button
          onClick={() => addText('normal')}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Text (T)"
        >
          <Type className="h-5 w-5 mx-auto" />
        </button>

        <hr className="border-gray-700" />

        {/* Drawing Tools */}
        <button
          onClick={() => setSelectedTool('pen')}
          className={`p-2 rounded w-full ${selectedTool === 'pen' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Pen Tool (P)"
        >
          <PenTool className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => setSelectedTool('brush')}
          className={`p-2 rounded w-full ${selectedTool === 'brush' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Brush (B)"
        >
          <Brush className="h-5 w-5 mx-auto" />
        </button>
        
        <button
          onClick={() => setSelectedTool('eraser')}
          className={`p-2 rounded w-full ${selectedTool === 'eraser' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Eraser (E)"
        >
          <Eraser className="h-5 w-5 mx-auto" />
        </button>

        <hr className="border-gray-700" />

        {/* Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded w-full text-gray-400 hover:bg-gray-800 hover:text-white"
          title="Upload Image"
        >
          <Image className="h-5 w-5 mx-auto" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Top Toolbar - Actions */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* History */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-5 w-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Copy/Paste */}
            <button
              onClick={copySelected}
              className="p-2 rounded hover:bg-gray-100"
              title="Copy (Ctrl+C)"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={paste}
              disabled={!clipboard}
              className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
              title="Paste (Ctrl+V)"
            >
              <Package className="h-5 w-5" />
            </button>
            <button
              onClick={duplicateSelected}
              className="p-2 rounded hover:bg-gray-100"
              title="Duplicate (Ctrl+D)"
            >
              <Layers className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Alignment */}
            <button
              onClick={() => alignObjects('left')}
              className="p-2 rounded hover:bg-gray-100"
              title="Align Left"
            >
              <AlignStartVertical className="h-5 w-5" />
            </button>
            <button
              onClick={() => alignObjects('center-h')}
              className="p-2 rounded hover:bg-gray-100"
              title="Align Center"
            >
              <AlignCenterVertical className="h-5 w-5" />
            </button>
            <button
              onClick={() => alignObjects('right')}
              className="p-2 rounded hover:bg-gray-100"
              title="Align Right"
            >
              <AlignEndVertical className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Arrange */}
            <button
              onClick={bringToFront}
              className="p-2 rounded hover:bg-gray-100"
              title="Bring to Front"
            >
              <BringToFront className="h-5 w-5" />
            </button>
            <button
              onClick={sendToBack}
              className="p-2 rounded hover:bg-gray-100"
              title="Send to Back"
            >
              <SendToBack className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Group */}
            <button
              onClick={groupSelected}
              className="p-2 rounded hover:bg-gray-100"
              title="Group (Ctrl+G)"
            >
              <Link2 className="h-5 w-5" />
            </button>
            <button
              onClick={ungroupSelected}
              className="p-2 rounded hover:bg-gray-100"
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Unlink className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Delete */}
            <button
              onClick={deleteSelected}
              className="p-2 rounded hover:bg-gray-100 text-red-600"
              title="Delete (Del)"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom */}
            <button
              onClick={zoomOut}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 rounded hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-2 rounded hover:bg-gray-100"
              title="Reset Zoom"
            >
              <Maximize className="h-5 w-5" />
            </button>

            <div className="w-px h-6 bg-gray-300" />

            {/* Export */}
            <button
              onClick={exportAsPNG}
              className="p-2 rounded hover:bg-gray-100"
              title="Export as PNG"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={exportAsSVG}
              className="p-2 rounded hover:bg-gray-100"
              title="Export as SVG"
            >
              <GalleryVertical className="h-5 w-5" />
            </button>
            <button
              onClick={exportAsJSON}
              className="p-2 rounded hover:bg-gray-100"
              title="Export as JSON"
            >
              <Save className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-auto p-8 bg-gray-100">
            <div className="inline-block bg-white rounded-lg shadow-2xl">
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* Right Panel - Properties */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            {/* Color Section */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colors
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fill Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={fillColor}
                      onChange={(e) => {
                        setFillColor(e.target.value)
                        updateSelectedObjects('fill', e.target.value)
                      }}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={fillColor}
                      onChange={(e) => {
                        setFillColor(e.target.value)
                        updateSelectedObjects('fill', e.target.value)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stroke Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => {
                        setCurrentColor(e.target.value)
                        updateSelectedObjects('stroke', e.target.value)
                      }}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentColor}
                      onChange={(e) => {
                        setCurrentColor(e.target.value)
                        updateSelectedObjects('stroke', e.target.value)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stroke Section */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Stroke & Opacity
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stroke Width: {strokeWidth}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={strokeWidth}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setStrokeWidth(value)
                      updateSelectedObjects('strokeWidth', value)
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opacity: {opacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setOpacity(value)
                      updateSelectedObjects('opacity', value / 100)
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Typography Section */}
            {selectedObjects.some(obj => obj.type === 'i-text' || obj.type === 'text') && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => {
                        setFontFamily(e.target.value)
                        updateSelectedObjects('fontFamily', e.target.value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      {fonts.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={fontSize}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setFontSize(value)
                        updateSelectedObjects('fontSize', value)
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateSelectedObjects('fontWeight', 'bold')}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Bold"
                    >
                      <Bold className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateSelectedObjects('fontStyle', 'italic')}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Italic"
                    >
                      <Italic className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateSelectedObjects('underline', true)}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Underline"
                    >
                      <Underline className="h-5 w-5 mx-auto" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateSelectedObjects('textAlign', 'left')}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Align Left"
                    >
                      <AlignLeft className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateSelectedObjects('textAlign', 'center')}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Align Center"
                    >
                      <AlignCenter className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateSelectedObjects('textAlign', 'right')}
                      className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-100"
                      title="Align Right"
                    >
                      <AlignRight className="h-5 w-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Effects Section */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Effects
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={shadowEnabled}
                      onChange={(e) => {
                        setShadowEnabled(e.target.checked)
                        const shadow = e.target.checked ? shadowOptions : null
                        updateSelectedObjects('shadow', shadow)
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Drop Shadow</span>
                  </label>
                </div>

                {shadowEnabled && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium mb-1">Blur</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={shadowOptions.blur}
                        onChange={(e) => {
                          const newOptions = { ...shadowOptions, blur: Number(e.target.value) }
                          setShadowOptions(newOptions)
                          updateSelectedObjects('shadow', newOptions)
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Offset X</label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={shadowOptions.offsetX}
                        onChange={(e) => {
                          const newOptions = { ...shadowOptions, offsetX: Number(e.target.value) }
                          setShadowOptions(newOptions)
                          updateSelectedObjects('shadow', newOptions)
                        }}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Offset Y</label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={shadowOptions.offsetY}
                        onChange={(e) => {
                          const newOptions = { ...shadowOptions, offsetY: Number(e.target.value) }
                          setShadowOptions(newOptions)
                          updateSelectedObjects('shadow', newOptions)
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Layers Panel */}
            <div className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Layers
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {canvas?.getObjects().reverse().map((obj: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => {
                      canvas.setActiveObject(obj)
                      canvas.renderAll()
                    }}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      selectedObjects.includes(obj) ? 'bg-purple-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">
                      {obj.type === 'i-text' ? obj.text?.substring(0, 20) + '...' : obj.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}