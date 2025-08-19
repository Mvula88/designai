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
  Layers, Lock, Unlock, Eye, EyeOff, Sparkles, Plus, X,
  Monitor, Smartphone, Tablet, Globe, Home, ShoppingCart,
  User, Settings, Mail, FileText, Layout, Grid
} from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'

// Dynamic imports
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
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#9333ea')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [zoom, setZoom] = useState(100)
  const [isPanning, setIsPanning] = useState(false)
  
  // Multi-page functionality
  const [pages, setPages] = useState<any[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [showPageMenu, setShowPageMenu] = useState(false)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  
  const supabase = createClient()

  // Load fabric.js and initialize canvas
  useEffect(() => {
    const initializeFabric = async () => {
      // Dynamically import fabric
      const fabricModule = await import('fabric')
      const fabricLib = fabricModule.fabric || (window as any).fabric
      
      if (!fabricLib || canvas) return
      
      // Find the canvas element
      const canvasElement = document.getElementById('fabric-canvas') as HTMLCanvasElement
      if (!canvasElement) return
      
      // Initialize fabric canvas with professional settings
      const newCanvas = new fabricLib.Canvas('fabric-canvas', {
        width: window.innerWidth - 500,
        height: window.innerHeight - 200,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        enableRetinaScaling: true,
        controlsAboveOverlay: true,
        allowTouchScrolling: true,
        imageSmoothingEnabled: true,
        selectionColor: 'rgba(147, 51, 234, 0.1)',
        selectionBorderColor: '#9333ea',
        selectionLineWidth: 2,
        selectionDashArray: [5, 5],
        snapAngle: 45,
        snapThreshold: 5,
        centeredScaling: true,
        centeredRotation: true,
      })
      
      // Configure professional controls like Figma
      if (fabricLib.Object && fabricLib.Object.prototype) {
        fabricLib.Object.prototype.set({
          transparentCorners: false,
          cornerColor: '#9333ea',
          cornerStrokeColor: '#ffffff',
          borderColor: '#9333ea',
          cornerSize: 8,
          cornerStyle: 'rect',
          borderScaleFactor: 1.5,
          borderOpacityWhenMoving: 0.5,
          borderDashArray: null,
          padding: 0,
          lockScalingFlip: true,
          noScaleCache: false,
          strokeUniform: true,
        })
        
        // Add custom delete control
        if (fabricLib.Object.prototype.controls) {
          const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3Csvg width='20' height='20' fill='%23ef4444' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm3.54 11.54L10 10l-3.54 3.54-.92-.92L9.08 10 5.54 6.46l.92-.92L10 9.08l3.54-3.54.92.92L10.92 10l3.54 3.54-.92.92z'/%3E%3C/svg%3E"
          const deleteImg = new Image()
          deleteImg.src = deleteIcon
          
          fabricLib.Object.prototype.controls.deleteControl = new fabricLib.Control({
            x: 0.5,
            y: -0.5,
            offsetY: -20,
            offsetX: 20,
            cursorStyle: 'pointer',
            mouseUpHandler: (eventData, target) => {
              const canvas = target.canvas
              if (canvas) {
                canvas.remove(target)
                canvas.requestRenderAll()
              }
              return true
            },
            render: function(ctx, left, top, styleOverride, fabricObject) {
              ctx.save()
              ctx.translate(left, top)
              ctx.drawImage(deleteImg, -10, -10, 20, 20)
              ctx.restore()
            },
          })
        }
      }
      
      // Add mouse panning support
      let isPanningActive = false
      let lastPosX = 0
      let lastPosY = 0
      
      newCanvas.on('mouse:down', (opt: any) => {
        const evt = opt.e
        if (evt.altKey || evt.spaceKey || isPanning) {
          isPanningActive = true
          setIsPanning(true)
          newCanvas.selection = false
          lastPosX = evt.clientX
          lastPosY = evt.clientY
        }
      })
      
      newCanvas.on('mouse:move', (opt: any) => {
        if (isPanningActive) {
          const evt = opt.e
          const deltaX = evt.clientX - lastPosX
          const deltaY = evt.clientY - lastPosY
          newCanvas.relativePan({ x: deltaX, y: deltaY })
          lastPosX = evt.clientX
          lastPosY = evt.clientY
          newCanvas.renderAll()
        }
      })
      
      newCanvas.on('mouse:up', () => {
        isPanningActive = false
        setIsPanning(false)
        newCanvas.selection = true
      })
      
      // Mouse wheel zoom
      newCanvas.on('mouse:wheel', (opt: any) => {
        const delta = opt.e.deltaY
        let zoom = newCanvas.getZoom()
        zoom *= 0.999 ** delta
        if (zoom > 4) zoom = 4
        if (zoom < 0.25) zoom = 0.25
        newCanvas.setZoom(zoom)
        opt.e.preventDefault()
        opt.e.stopPropagation()
        setZoom(Math.round(zoom * 100))
      })
      
      // Add keyboard shortcuts for professional workflow
      const handleKeyDown = (e: KeyboardEvent) => {
        // Space bar for panning
        if (e.key === ' ' && !e.repeat) {
          e.preventDefault()
          setIsPanning(true)
          newCanvas.selection = false
        }
        
        // Prevent browser defaults for design shortcuts
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault()
          const activeObjects = newCanvas.getActiveObjects()
          activeObjects.forEach((obj: any) => newCanvas.remove(obj))
          newCanvas.discardActiveObject()
          newCanvas.renderAll()
        }
        
        // Duplicate (Ctrl/Cmd + D)
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
          e.preventDefault()
          const activeObject = newCanvas.getActiveObject()
          if (activeObject) {
            activeObject.clone((cloned: any) => {
              cloned.set({
                left: (cloned.left || 0) + 10,
                top: (cloned.top || 0) + 10,
              })
              newCanvas.add(cloned)
              newCanvas.setActiveObject(cloned)
              newCanvas.renderAll()
            })
          }
        }
        
        // Group (Ctrl/Cmd + G)
        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
          e.preventDefault()
          const activeObjects = newCanvas.getActiveObjects()
          if (activeObjects.length > 1) {
            const group = new fabricLib.Group(activeObjects)
            newCanvas.remove(...activeObjects)
            newCanvas.add(group)
            newCanvas.setActiveObject(group)
            newCanvas.renderAll()
          }
        }
        
        // Select All (Ctrl/Cmd + A)
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault()
          newCanvas.discardActiveObject()
          const selection = new fabricLib.ActiveSelection(newCanvas.getObjects(), {
            canvas: newCanvas,
          })
          newCanvas.setActiveObject(selection)
          newCanvas.renderAll()
        }
      }
      
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          e.preventDefault()
          setIsPanning(false)
          newCanvas.selection = true
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
      
      setFabric(fabricLib)
      setCanvas(newCanvas)
      handleCanvasReady(newCanvas)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
      }
      
      // Handle window resize
      const handleResize = () => {
        const container = canvasElement.parentElement
        if (container) {
          newCanvas.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          })
          newCanvas.renderAll()
        }
      }
      window.addEventListener('resize', handleResize)
      handleResize()
      
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    
    setTimeout(initializeFabric, 100)
  }, [])

  // Load design data and pages
  useEffect(() => {
    if (designId && designId !== 'new') {
      loadDesign()
      loadPages()
    } else {
      // Initialize with default page for new design
      initializeDefaultPages()
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

  const loadPages = async () => {
    const { data, error } = await supabase
      .from('design_pages')
      .select('*')
      .eq('design_id', designId)
      .order('order_index')

    if (data && data.length > 0) {
      setPages(data)
      setCurrentPageId(data[0].id)
    } else {
      // Create default pages if none exist
      await createDefaultPages()
    }
  }

  const initializeDefaultPages = () => {
    const defaultPages = [
      { id: 'temp-home', name: 'Home', type: 'page', icon: 'Home', canvas_data: null, order_index: 0 },
      { id: 'temp-about', name: 'About', type: 'page', icon: 'User', canvas_data: null, order_index: 1 },
      { id: 'temp-contact', name: 'Contact', type: 'page', icon: 'Mail', canvas_data: null, order_index: 2 }
    ]
    setPages(defaultPages)
    setCurrentPageId('temp-home')
  }

  const createDefaultPages = async () => {
    const defaultPages = [
      { name: 'Home', type: 'page', icon: 'Home', design_id: designId, order_index: 0 },
      { name: 'About', type: 'page', icon: 'User', design_id: designId, order_index: 1 },
      { name: 'Contact', type: 'page', icon: 'Mail', design_id: designId, order_index: 2 }
    ]

    const { data, error } = await supabase
      .from('design_pages')
      .insert(defaultPages)
      .select()

    if (data) {
      setPages(data)
      setCurrentPageId(data[0].id)
    }
  }

  const handleCanvasReady = (fabricCanvas: any) => {
    // Canvas is ready for use
    console.log('Canvas ready:', fabricCanvas)
  }

  const handleCanvasSave = async (canvasData: any) => {
    if (!designId || designId === 'new' || !currentPageId) return

    setSaving(true)
    
    // Save current page canvas data
    if (currentPageId.startsWith('temp-')) {
      // For new designs, update temporary page data
      setPages(prev => prev.map(page => 
        page.id === currentPageId 
          ? { ...page, canvas_data: canvasData }
          : page
      ))
    } else {
      // Save to database for existing pages
      const { error } = await supabase
        .from('design_pages')
        .update({
          canvas_data: canvasData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentPageId)

      if (error) {
        toast.error('Failed to save page')
        setSaving(false)
        return
      }
    }

    // Also update main design record
    const { error: designError } = await supabase
      .from('designs')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)

    setSaving(false)
    if (designError) {
      toast.error('Failed to save design')
    } else {
      toast.success('Page saved')
    }
  }

  // Page Management Functions
  const switchPage = async (pageId: string) => {
    // Save current page before switching
    if (canvas) {
      await handleCanvasSave(canvas.toJSON())
    }

    setCurrentPageId(pageId)
    
    // Load the new page's canvas data
    const page = pages.find(p => p.id === pageId)
    if (page?.canvas_data && canvas) {
      canvas.loadFromJSON(page.canvas_data, () => {
        canvas.renderAll()
      })
    } else if (canvas) {
      // Clear canvas for new page
      canvas.clear()
      canvas.renderAll()
    }
  }

  const addNewPage = async () => {
    const pageTypes = [
      { name: 'Blank Page', icon: 'FileText' },
      { name: 'Landing Page', icon: 'Home' },
      { name: 'Product Page', icon: 'ShoppingCart' },
      { name: 'About Page', icon: 'User' },
      { name: 'Contact Page', icon: 'Mail' },
      { name: 'Settings Page', icon: 'Settings' },
      { name: 'Dashboard', icon: 'Layout' },
      { name: 'Gallery', icon: 'Grid' }
    ]

    // For now, create a blank page. Later can add a page type selector
    const newPageName = `Page ${pages.length + 1}`
    
    if (designId === 'new' || currentPageId.startsWith('temp-')) {
      // Add to temporary pages
      const newPage = {
        id: `temp-${Date.now()}`,
        name: newPageName,
        type: 'page',
        icon: 'FileText',
        canvas_data: null,
        order_index: pages.length
      }
      setPages(prev => [...prev, newPage])
      setCurrentPageId(newPage.id)
    } else {
      // Save to database
      const { data, error } = await supabase
        .from('design_pages')
        .insert({
          name: newPageName,
          type: 'page',
          icon: 'FileText',
          design_id: designId,
          order_index: pages.length
        })
        .select()
        .single()

      if (data) {
        setPages(prev => [...prev, data])
        setCurrentPageId(data.id)
        if (canvas) {
          canvas.clear()
          canvas.renderAll()
        }
        toast.success('New page created')
      } else if (error) {
        toast.error('Failed to create page')
      }
    }
  }

  const deletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the last page')
      return
    }

    if (!pageId.startsWith('temp-')) {
      const { error } = await supabase
        .from('design_pages')
        .delete()
        .eq('id', pageId)

      if (error) {
        toast.error('Failed to delete page')
        return
      }
    }

    const updatedPages = pages.filter(p => p.id !== pageId)
    setPages(updatedPages)
    
    // Switch to first page if current page was deleted
    if (currentPageId === pageId && updatedPages.length > 0) {
      setCurrentPageId(updatedPages[0].id)
      const firstPage = updatedPages[0]
      if (firstPage.canvas_data && canvas) {
        canvas.loadFromJSON(firstPage.canvas_data, () => {
          canvas.renderAll()
        })
      }
    }
    
    toast.success('Page deleted')
  }

  const renamePage = async (pageId: string, newName: string) => {
    if (!pageId.startsWith('temp-')) {
      const { error } = await supabase
        .from('design_pages')
        .update({ name: newName })
        .eq('id', pageId)

      if (error) {
        toast.error('Failed to rename page')
        return
      }
    }

    setPages(prev => prev.map(page =>
      page.id === pageId ? { ...page, name: newName } : page
    ))
    toast.success('Page renamed')
  }

  // Professional shape creation like Figma
  const addShape = (shapeType: string) => {
    if (!canvas || !fabric) return

    let shape
    const center = canvas.getCenter()
    const defaultSize = 100

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          left: center.left - defaultSize/2,
          top: center.top - defaultSize/2,
          width: defaultSize,
          height: defaultSize,
          fill: selectedColor,
          stroke: null,
          strokeWidth: strokeWidth,
          rx: 0,
          ry: 0,
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: center.left - defaultSize/2,
          top: center.top - defaultSize/2,
          radius: defaultSize/2,
          fill: selectedColor,
          stroke: null,
          strokeWidth: strokeWidth,
        })
        break
      case 'triangle':
        shape = new fabric.Triangle({
          left: center.left - defaultSize/2,
          top: center.top - defaultSize/2,
          width: defaultSize,
          height: defaultSize,
          fill: selectedColor,
          stroke: null,
          strokeWidth: strokeWidth,
        })
        break
      case 'line':
        shape = new fabric.Line(
          [center.left - defaultSize/2, center.top, center.left + defaultSize/2, center.top],
          {
            stroke: selectedColor,
            strokeWidth: strokeWidth,
            strokeLineCap: 'round',
          }
        )
        break
      case 'star':
        const spikes = 5
        const outerRadius = defaultSize/2
        const innerRadius = defaultSize/4
        const points = []
        const cx = 0
        const cy = 0
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (Math.PI * i) / spikes - Math.PI / 2
          points.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
          })
        }
        
        shape = new fabric.Polygon(points, {
          left: center.left,
          top: center.top,
          fill: selectedColor,
          stroke: null,
          strokeWidth: strokeWidth,
          originX: 'center',
          originY: 'center',
        })
        break
      case 'ellipse':
        shape = new fabric.Ellipse({
          left: center.left - defaultSize/2,
          top: center.top - defaultSize/3,
          rx: defaultSize/2,
          ry: defaultSize/3,
          fill: selectedColor,
          stroke: null,
          strokeWidth: strokeWidth,
        })
        break
      case 'text':
        shape = new fabric.IText('Type your text', {
          left: center.left,
          top: center.top,
          fontSize: 24,
          fill: selectedColor,
          fontFamily: 'Inter, system-ui, sans-serif',
          originX: 'center',
          originY: 'center',
        })
        break
      case 'frame':
        shape = new fabric.Rect({
          left: center.left - 200,
          top: center.top - 150,
          width: 400,
          height: 300,
          fill: 'transparent',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: true,
          hasControls: true,
          hasBorders: true,
        })
        break
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
      toast.success(`Added ${shapeType}`)
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

  // Professional alignment functions like Figma
  const alignObjects = (alignment: string) => {
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
      
      switch (alignment) {
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
    toast.success(`Aligned ${alignment}`)
  }

  // Distribute objects evenly
  const distributeObjects = (direction: 'horizontal' | 'vertical') => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 3) return

    const sorted = [...activeObjects].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.left - b.left
      }
      return a.top - b.top
    })

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    if (direction === 'horizontal') {
      const totalWidth = last.left - first.left
      const spacing = totalWidth / (sorted.length - 1)
      
      sorted.forEach((obj, index) => {
        if (index !== 0 && index !== sorted.length - 1) {
          obj.set({ left: first.left + spacing * index })
          obj.setCoords()
        }
      })
    } else {
      const totalHeight = last.top - first.top
      const spacing = totalHeight / (sorted.length - 1)
      
      sorted.forEach((obj, index) => {
        if (index !== 0 && index !== sorted.length - 1) {
          obj.set({ top: first.top + spacing * index })
          obj.setCoords()
        }
      })
    }

    canvas.renderAll()
    toast.success(`Distributed ${direction}`)
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
          
          {/* Edit Tools Only */}
          <div className="flex items-center gap-1 border-l border-gray-700 pl-4">
            <button
              onClick={handleUndo}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={handleRedo}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </button>
            <button
              onClick={duplicateSelected}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Duplicate (Ctrl+D)"
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
            
            <div className="h-6 w-px bg-gray-700 mx-1" />
            
            {/* Alignment Tools */}
            <button
              onClick={() => alignObjects('left')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('center-h')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => alignObjects('right')}
              className="p-2 rounded text-gray-400 hover:bg-gray-800"
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Switcher with Scroll */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 max-w-lg overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {pages.map((page, index) => {
              const IconComponent = {
                Home, User, Mail, FileText, ShoppingCart, Settings, Layout, Grid, Globe
              }[page.icon] || FileText

              return (
                <div
                  key={page.id}
                  className={`group flex items-center gap-1 px-2 py-1 rounded text-xs transition-all flex-shrink-0 ${
                    currentPageId === page.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <button
                    onClick={() => switchPage(page.id)}
                    className="flex items-center gap-1"
                    title={page.name}
                  >
                    <IconComponent className="h-3 w-3" />
                    <span className="whitespace-nowrap">{page.name}</span>
                  </button>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePage(page.id)
                      }}
                      className="ml-1 p-0.5 rounded hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  )}
                </div>
              )
            })}
            
            <button
              onClick={addNewPage}
              className="p-1 rounded text-gray-400 hover:text-gray-300 hover:bg-gray-700"
              title="Add new page"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          {/* Device Preview */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setDevicePreview('desktop')}
              className={`p-1 rounded ${devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
              title="Desktop view"
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDevicePreview('tablet')}
              className={`p-1 rounded ${devicePreview === 'tablet' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
              title="Tablet view"
            >
              <Tablet className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDevicePreview('mobile')}
              className={`p-1 rounded ${devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-300'}`}
              title="Mobile view"
            >
              <Smartphone className="h-3 w-3" />
            </button>
          </div>

          <span className="text-sm text-gray-400">
            {designData?.title || 'Untitled Design'}
          </span>
          {saving && <span className="text-xs text-gray-500">Saving...</span>}
          
          <div className="h-6 w-px bg-gray-700 mx-2" />
          
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
        {/* Left Sidebar - Tool Palette */}
        <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-2 gap-1">
          {/* Selection Tools */}
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all ${activeTool === 'select' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Select (V)"
          >
            <MousePointer className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setActiveTool('move')}
            className={`p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all ${activeTool === 'move' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Move (H)"
          >
            <Move className="h-4 w-4" />
          </button>
          
          <div className="w-10 h-px bg-gray-700 my-1" />
          
          {/* Shape Tools */}
          <button
            onClick={() => addShape('rect')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Rectangle (R)"
          >
            <Square className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('circle')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Circle (O)"
          >
            <Circle className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('triangle')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Triangle"
          >
            <Triangle className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('star')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Star"
          >
            <Star className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('line')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Line (L)"
          >
            <Minus className="h-4 w-4" />
          </button>
          
          <div className="w-10 h-px bg-gray-700 my-1" />
          
          {/* Text & Drawing */}
          <button
            onClick={() => setActiveTool('pen')}
            className={`p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all ${activeTool === 'pen' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Pen (P)"
          >
            <PenTool className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => addShape('text')}
            className="p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Text (T)"
          >
            <Type className="h-4 w-4" />
          </button>
          
          <div className="w-10 h-px bg-gray-700 my-1" />
          
          {/* More Tools */}
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={`p-2.5 rounded-lg w-10 h-10 flex items-center justify-center transition-all mt-auto ${leftPanelOpen ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            title="Advanced Tools"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
        
        {/* Extended Tools Panel - Advanced Tools */}
        {leftPanelOpen && canvas && fabric && (
          <FigmaLikeToolbar canvas={canvas} fabric={fabric} />
        )}

        {/* Canvas Editor */}
        <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
          {/* Canvas Container with Device Preview */}
          <div 
            className={`bg-white shadow-xl transition-all duration-300 ${
              devicePreview === 'desktop' ? 'w-full h-full' :
              devicePreview === 'tablet' ? 'w-[768px] h-[1024px] rounded-lg' :
              'w-[375px] h-[667px] rounded-lg'
            }`}
            style={{
              maxWidth: devicePreview === 'desktop' ? '100%' : undefined,
              maxHeight: devicePreview === 'desktop' ? '100%' : 'calc(100vh - 120px)'
            }}
          >
            {/* Page Title Bar */}
            <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {(() => {
                  const currentPage = pages.find(p => p.id === currentPageId)
                  const IconComponent = currentPage ? {
                    Home, User, Mail, FileText, ShoppingCart, Settings, Layout, Grid, Globe
                  }[currentPage.icon] || FileText : FileText
                  
                  return (
                    <>
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {currentPage?.name || 'Untitled Page'}
                      </span>
                    </>
                  )
                })()}
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${devicePreview === 'desktop' ? 'bg-green-500' : devicePreview === 'tablet' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                <span className="text-xs text-gray-500 capitalize">{devicePreview}</span>
              </div>
            </div>
            
            {/* Canvas Area with Zoom/Pan */}
            <div 
              className="relative w-full h-full overflow-auto bg-gray-50"
              style={{ 
                cursor: isPanning ? 'grabbing' : 'default',
              }}
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault()
                  const delta = e.deltaY > 0 ? -10 : 10
                  const newZoom = Math.max(25, Math.min(400, zoom + delta))
                  setZoom(newZoom)
                  if (canvas) {
                    canvas.setZoom(newZoom / 100)
                    canvas.setDimensions({
                      width: (window.innerWidth - 500) * (newZoom / 100),
                      height: (window.innerHeight - 200) * (newZoom / 100),
                    })
                    canvas.renderAll()
                  }
                }
              }}
            >
              <div 
                className="flex items-center justify-center"
                style={{
                  minWidth: '100%',
                  minHeight: '100%',
                  padding: '2rem',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                <canvas 
                  id="fabric-canvas"
                  className="shadow-2xl bg-white"
                />
              </div>
              
              {/* Floating Zoom Controls */}
              <div className="absolute bottom-4 left-4 bg-gray-900 rounded-lg shadow-lg p-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    const newZoom = Math.max(25, zoom - 10)
                    setZoom(newZoom)
                    if (canvas) {
                      canvas.setZoom(newZoom / 100)
                      canvas.renderAll()
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-400 font-medium w-12 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => {
                    const newZoom = Math.min(400, zoom + 10)
                    setZoom(newZoom)
                    if (canvas) {
                      canvas.setZoom(newZoom / 100)
                      canvas.renderAll()
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-gray-700" />
                <button
                  onClick={() => {
                    setZoom(100)
                    if (canvas) {
                      canvas.setZoom(1)
                      canvas.renderAll()
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-800 text-gray-400"
                  title="Reset Zoom"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
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