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
  Hand,
  Trash2,
  Copy,
  Download,
  Undo,
  Redo,
  Save,
  ZoomIn,
  ZoomOut,
  Maximize,
  Bold,
  Italic,
  Underline,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FabricEditorProps {
  designId?: string
  initialData?: any
  onSave?: (data: any) => void
  onCanvasReady?: (canvas: any) => void
}

export function FabricEditor({
  designId,
  initialData,
  onSave,
  onCanvasReady,
}: FabricEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<any>(null)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [canvasHistory, setCanvasHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [fontSize, setFontSize] = useState(24)
  const [zoom, setZoom] = useState(100)
  const [fabricLib, setFabricLib] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Load fabric.js dynamically
  useEffect(() => {
    import('fabric').then((fabricModule) => {
      setFabricLib(fabricModule)
    })
  }, [])

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current || !fabricLib) return

    const fabricCanvas = new fabricLib.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      selectionColor: 'rgba(106, 126, 234, 0.1)',
      selectionBorderColor: '#667eea',
      selectionLineWidth: 2,
    })

    // Custom controls for objects
    fabricLib.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#667eea',
      cornerStrokeColor: '#667eea',
      borderColor: '#667eea',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderScaleFactor: 2,
    })

    // Load initial data
    if (initialData) {
      fabricCanvas.loadFromJSON(initialData, () => {
        fabricCanvas.renderAll()
        saveToHistory(fabricCanvas)
      })
    } else {
      saveToHistory(fabricCanvas)
    }

    // Event listeners
    fabricCanvas.on('object:modified', () => handleCanvasChange(fabricCanvas))
    fabricCanvas.on('object:added', () => handleCanvasChange(fabricCanvas))
    fabricCanvas.on('object:removed', () => handleCanvasChange(fabricCanvas))
    fabricCanvas.on('selection:created', (e) =>
      setSelectedObjects(e.selected || [])
    )
    fabricCanvas.on('selection:updated', (e) =>
      setSelectedObjects(e.selected || [])
    )
    fabricCanvas.on('selection:cleared', () => setSelectedObjects([]))

    setCanvas(fabricCanvas)

    if (onCanvasReady) {
      onCanvasReady(fabricCanvas)
    }

    return () => {
      fabricCanvas.dispose()
    }
  }, [fabricLib]) // Only re-initialize when fabricLib loads

  // Tool selection
  const selectTool = useCallback(
    (tool: string) => {
      if (!canvas || !fabricLib) return

      setSelectedTool(tool)

      // Reset canvas modes
      canvas.isDrawingMode = false
      canvas.selection = true
      canvas.defaultCursor = 'default'
      canvas.off('mouse:down')
      canvas.off('mouse:move')
      canvas.off('mouse:up')

      switch (tool) {
        case 'select':
          canvas.selection = true
          break

        case 'rectangle':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          drawRectangle()
          break

        case 'circle':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          drawCircle()
          break

        case 'text':
          canvas.selection = false
          canvas.defaultCursor = 'text'
          addText()
          break

        case 'line':
          canvas.selection = false
          canvas.defaultCursor = 'crosshair'
          drawLine()
          break

        case 'pen':
          canvas.isDrawingMode = true
          canvas.freeDrawingBrush = new fabricLib.PencilBrush(canvas)
          canvas.freeDrawingBrush.width = strokeWidth
          canvas.freeDrawingBrush.color = currentColor
          break
      }
    },
    [canvas, currentColor, strokeWidth, fabricLib]
  )

  // Drawing functions
  const drawRectangle = () => {
    if (!canvas) return

    let isDrawing = false
    let rect: any = null
    let startX = 0,
      startY = 0

    canvas.on('mouse:down', (e: any) => {
      isDrawing = true
      const pointer = canvas.getPointer(e.e)
      startX = pointer.x
      startY = pointer.y

      rect = new fabricLib.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: currentColor,
        strokeWidth: strokeWidth,
        opacity: 0.8,
      })

      canvas.add(rect)
    })

    canvas.on('mouse:move', (e: any) => {
      if (!isDrawing || !rect) return

      const pointer = canvas.getPointer(e.e)
      const width = pointer.x - startX
      const height = pointer.y - startY

      rect.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : startX,
        top: height < 0 ? pointer.y : startY,
      })

      canvas.renderAll()
    })

    canvas.on('mouse:up', () => {
      isDrawing = false
      setSelectedTool('select')
      canvas.selection = true
      canvas.off('mouse:down')
      canvas.off('mouse:move')
      canvas.off('mouse:up')
    })
  }

  const drawCircle = () => {
    if (!canvas) return

    let isDrawing = false
    let circle: any = null
    let startX = 0,
      startY = 0

    canvas.on('mouse:down', (e: any) => {
      isDrawing = true
      const pointer = canvas.getPointer(e.e)
      startX = pointer.x
      startY = pointer.y

      circle = new fabricLib.Circle({
        left: startX,
        top: startY,
        radius: 0,
        fill: currentColor,
        strokeWidth: strokeWidth,
        opacity: 0.8,
        originX: 'center',
        originY: 'center',
      })

      canvas.add(circle)
    })

    canvas.on('mouse:move', (e: any) => {
      if (!isDrawing || !circle) return

      const pointer = canvas.getPointer(e.e)
      const radius = Math.sqrt(
        Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
      )

      circle.set({ radius })
      canvas.renderAll()
    })

    canvas.on('mouse:up', () => {
      isDrawing = false
      setSelectedTool('select')
      canvas.selection = true
      canvas.off('mouse:down')
      canvas.off('mouse:move')
      canvas.off('mouse:up')
    })
  }

  const drawLine = () => {
    if (!canvas) return

    let isDrawing = false
    let line: any = null

    canvas.on('mouse:down', (e: any) => {
      isDrawing = true
      const pointer = canvas.getPointer(e.e)

      line = new fabricLib.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: currentColor,
        strokeWidth: strokeWidth,
        strokeLineCap: 'round',
      })

      canvas.add(line)
    })

    canvas.on('mouse:move', (e: any) => {
      if (!isDrawing || !line) return

      const pointer = canvas.getPointer(e.e)
      line.set({ x2: pointer.x, y2: pointer.y })
      canvas.renderAll()
    })

    canvas.on('mouse:up', () => {
      isDrawing = false
      setSelectedTool('select')
      canvas.selection = true
      canvas.off('mouse:down')
      canvas.off('mouse:move')
      canvas.off('mouse:up')
    })
  }

  const addText = () => {
    if (!canvas) return

    canvas.on('mouse:down', (e: any) => {
      const pointer = canvas.getPointer(e.e)

      const text = new fabricLib.IText('Click to edit text', {
        left: pointer.x,
        top: pointer.y,
        fontSize: fontSize,
        fill: currentColor,
        editable: true,
      })

      canvas.add(text)
      canvas.setActiveObject(text)
      text.enterEditing()
      text.selectAll()

      setSelectedTool('select')
      canvas.selection = true
      canvas.off('mouse:down')
    })
  }

  // Object operations
  const deleteSelected = () => {
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length) {
      activeObjects.forEach((obj: any) => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
      toast.success(`${activeObjects.length} object(s) deleted`)
    }
  }

  const duplicateSelected = () => {
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length === 0) return

    activeObjects.forEach((obj: any) => {
      obj.clone((cloned: any) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        })
        canvas.add(cloned)
      })
    })

    canvas.renderAll()
    toast.success(`${activeObjects.length} object(s) duplicated`)
  }

  // History management
  const saveToHistory = (fabricCanvas: any) => {
    const json = JSON.stringify(fabricCanvas.toJSON())
    const newHistory = canvasHistory.slice(0, historyIndex + 1)
    newHistory.push(json)

    if (newHistory.length > 50) {
      newHistory.shift()
    }

    setCanvasHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleCanvasChange = (fabricCanvas: any) => {
    saveToHistory(fabricCanvas)

    if (onSave) {
      onSave(fabricCanvas.toJSON())
    }
  }

  const undo = () => {
    if (!canvas || historyIndex <= 0) return

    const newIndex = historyIndex - 1
    canvas.loadFromJSON(canvasHistory[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }

  const redo = () => {
    if (!canvas || historyIndex >= canvasHistory.length - 1) return

    const newIndex = historyIndex + 1
    canvas.loadFromJSON(canvasHistory[newIndex], () => {
      canvas.renderAll()
      setHistoryIndex(newIndex)
    })
  }

  // File operations
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canvas) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      fabricLib.Image.fromURL(event.target?.result as string).then((img: any) => {
        const scale = Math.min(400 / (img.width || 1), 400 / (img.height || 1))
        img.scale(scale)
        img.set({
          left: 100,
          top: 100,
        })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
        toast.success('Image added to canvas')
      })
    }
    reader.readAsDataURL(file)
  }

  const exportCanvas = (format: 'png' | 'jpg' | 'svg' = 'png') => {
    if (!canvas) return

    if (format === 'svg') {
      const svg = canvas.toSVG()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `design.${format}`
      link.href = url
      link.click()
    } else {
      const dataURL = canvas.toDataURL({
        format: format,
        quality: 1,
        multiplier: 2,
      })

      const link = document.createElement('a')
      link.download = `design.${format}`
      link.href = dataURL
      link.click()
    }

    toast.success(`Design exported as ${format.toUpperCase()}`)
  }

  // Save to database
  const saveDesign = async () => {
    if (!canvas || !designId) return

    const canvasData = canvas.toJSON()
    const thumbnail = canvas.toDataURL({
      format: 'png',
      quality: 0.3,
      width: 200,
      height: 150,
    })

    const { error } = await supabase
      .from('designs')
      .update({
        canvas_data: canvasData,
        thumbnail_url: thumbnail,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)

    if (!error) {
      toast.success('Design saved')
    } else {
      toast.error('Failed to save design')
    }
  }

  // Zoom controls
  const handleZoom = (delta: number) => {
    if (!canvas) return

    let newZoom = zoom + delta
    newZoom = Math.max(25, Math.min(400, newZoom))

    const zoomRatio = newZoom / 100
    canvas.setZoom(zoomRatio)
    canvas.setDimensions({
      width: 800 * zoomRatio,
      height: 600 * zoomRatio,
    })
    setZoom(newZoom)
  }

  const resetZoom = () => {
    if (!canvas) return

    canvas.setZoom(1)
    canvas.setDimensions({
      width: 800,
      height: 600,
    })
    setZoom(100)
  }

  if (!fabricLib) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Toolbar */}
      <div className="flex w-16 flex-col gap-2 bg-gray-900 p-2 shadow-lg">
        <button
          className={`rounded p-2 ${selectedTool === 'select' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('select')}
          title="Select Tool (V)"
        >
          <MousePointer className="h-5 w-5" />
        </button>

        <button
          className={`rounded p-2 ${selectedTool === 'rectangle' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('rectangle')}
          title="Rectangle (R)"
        >
          <Square className="h-5 w-5" />
        </button>

        <button
          className={`rounded p-2 ${selectedTool === 'circle' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('circle')}
          title="Circle (C)"
        >
          <Circle className="h-5 w-5" />
        </button>

        <button
          className={`rounded p-2 ${selectedTool === 'line' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('line')}
          title="Line (L)"
        >
          <Minus className="h-5 w-5" />
        </button>

        <button
          className={`rounded p-2 ${selectedTool === 'text' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('text')}
          title="Text (T)"
        >
          <Type className="h-5 w-5" />
        </button>

        <button
          className={`rounded p-2 ${selectedTool === 'pen' ? 'bg-gray-700' : 'hover:bg-gray-700'} text-white`}
          onClick={() => selectTool('pen')}
          title="Pen Tool (P)"
        >
          <PenTool className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Image"
        >
          <Image className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="flex-1" />

        <button
          className="rounded p-2 text-white hover:bg-gray-700 disabled:opacity-50"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700 disabled:opacity-50"
          onClick={redo}
          disabled={historyIndex >= canvasHistory.length - 1}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700"
          onClick={duplicateSelected}
          disabled={selectedObjects.length === 0}
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700"
          onClick={deleteSelected}
          disabled={selectedObjects.length === 0}
          title="Delete"
        >
          <Trash2 className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700"
          onClick={saveDesign}
          title="Save (Ctrl+S)"
        >
          <Save className="h-5 w-5" />
        </button>

        <button
          className="rounded p-2 text-white hover:bg-gray-700"
          onClick={() => exportCanvas('png')}
          title="Export"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>

      {/* Properties Panel */}
      <div className="w-72 overflow-y-auto border-r border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">Properties</h3>

        {/* Color Control */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Fill Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value)
                selectedObjects.forEach((obj) => {
                  obj.set('fill', e.target.value)
                })
                canvas?.renderAll()
              }}
              className="h-10 w-full"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-24 rounded border px-2 text-sm"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Stroke Width: {strokeWidth}px
          </label>
          <input
            type="range"
            value={strokeWidth}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              setStrokeWidth(value)
              selectedObjects.forEach((obj) => {
                obj.set('strokeWidth', value)
              })
              canvas?.renderAll()
            }}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Font Size for text */}
        {selectedObjects.some(
          (obj) => obj.type === 'i-text' || obj.type === 'text'
        ) && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              value={fontSize}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                setFontSize(value)
                selectedObjects.forEach((obj) => {
                  if (obj.type === 'i-text' || obj.type === 'text') {
                    obj.set('fontSize', value)
                  }
                })
                canvas?.renderAll()
              }}
              min={8}
              max={120}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Text Formatting */}
        {selectedObjects.some(
          (obj) => obj.type === 'i-text' || obj.type === 'text'
        ) && (
          <div className="mb-4 flex gap-2">
            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={() => {
                selectedObjects.forEach((obj) => {
                  if (obj.type === 'i-text' || obj.type === 'text') {
                    const current = obj.get('fontWeight')
                    obj.set(
                      'fontWeight',
                      current === 'bold' ? 'normal' : 'bold'
                    )
                  }
                })
                canvas?.renderAll()
              }}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>

            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={() => {
                selectedObjects.forEach((obj) => {
                  if (obj.type === 'i-text' || obj.type === 'text') {
                    const current = obj.get('fontStyle')
                    obj.set(
                      'fontStyle',
                      current === 'italic' ? 'normal' : 'italic'
                    )
                  }
                })
                canvas?.renderAll()
              }}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>

            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={() => {
                selectedObjects.forEach((obj) => {
                  if (obj.type === 'i-text' || obj.type === 'text') {
                    const current = obj.get('underline')
                    obj.set('underline', !current)
                  }
                })
                canvas?.renderAll()
              }}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-6">
          <h4 className="mb-2 font-medium">Export</h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => exportCanvas('png')}
            >
              PNG
            </button>
            <button
              className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => exportCanvas('jpg')}
            >
              JPG
            </button>
            <button
              className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
              onClick={() => exportCanvas('svg')}
            >
              SVG
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 overflow-auto bg-gray-100">
        {/* Top Toolbar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex h-12 items-center gap-4 border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={() => handleZoom(-25)}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-sm font-medium">
              {zoom}%
            </span>
            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={() => handleZoom(25)}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              className="rounded border p-2 hover:bg-gray-100"
              onClick={resetZoom}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1" />

          <div className="text-sm text-gray-600">
            {selectedObjects.length > 0 && (
              <span>{selectedObjects.length} object(s) selected</span>
            )}
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex h-full items-center justify-center p-8 pt-12">
          <div className="overflow-hidden rounded-lg bg-white shadow-xl">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FabricEditor
