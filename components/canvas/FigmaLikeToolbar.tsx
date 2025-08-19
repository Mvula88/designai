'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  // Selection & Transform
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  
  // Shapes & Drawing
  Square,
  Circle,
  Triangle,
  Hexagon,
  Pentagon,
  Star,
  Minus,
  PenTool,
  Type,
  
  // Alignment & Distribution
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  AlignTop,
  AlignCenterVertical,
  AlignBottom,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  
  // Boolean Operations
  GitMerge,
  GitPullRequest,
  GitCommit,
  Scissors,
  
  // Layers & Organization
  Layers,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Effects & Styles
  Droplet,
  Sun,
  Zap,
  Wind,
  
  // Components & Symbols
  Package,
  Component,
  Copy,
  
  // Layout
  Grid3x3,
  Layout,
  Columns,
  Rows,
  
  // Typography
  Bold,
  Italic,
  Underline,
  AlignJustify,
  List,
  
  // Other Tools
  Pipette,
  Ruler,
  Settings,
  ChevronDown,
  Plus,
  X,
  Check,
  Info,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

interface FigmaLikeToolbarProps {
  canvas: any
  fabric: any
}

export function FigmaLikeToolbar({ canvas, fabric }: FigmaLikeToolbarProps) {
  const [activeTool, setActiveTool] = useState('select')
  const [selectedObjects, setSelectedObjects] = useState<any[]>([])
  const [showAutoLayout, setShowAutoLayout] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [showConstraints, setShowConstraints] = useState(false)
  
  // Auto Layout Settings
  const [autoLayoutSettings, setAutoLayoutSettings] = useState({
    direction: 'horizontal' as 'horizontal' | 'vertical',
    spacing: 16,
    padding: 16,
    itemSpacing: 'packed' as 'packed' | 'space-between',
    wrap: false,
  })
  
  // Constraints Settings
  const [constraints, setConstraints] = useState({
    horizontal: 'left' as 'left' | 'right' | 'center' | 'scale' | 'leftright',
    vertical: 'top' as 'top' | 'bottom' | 'center' | 'scale' | 'topbottom',
  })
  
  // Effects
  const [effects, setEffects] = useState({
    shadow: {
      enabled: false,
      x: 0,
      y: 4,
      blur: 8,
      spread: 0,
      color: 'rgba(0,0,0,0.1)',
    },
    innerShadow: {
      enabled: false,
      x: 0,
      y: 2,
      blur: 4,
      color: 'rgba(0,0,0,0.1)',
    },
    blur: {
      enabled: false,
      type: 'layer' as 'layer' | 'background',
      amount: 4,
    },
  })

  useEffect(() => {
    if (!canvas) return

    const handleSelection = () => {
      const selected = canvas.getActiveObjects()
      setSelectedObjects(selected)
    }

    canvas.on('selection:created', handleSelection)
    canvas.on('selection:updated', handleSelection)
    canvas.on('selection:cleared', () => setSelectedObjects([]))

    return () => {
      canvas.off('selection:created', handleSelection)
      canvas.off('selection:updated', handleSelection)
      canvas.off('selection:cleared')
    }
  }, [canvas])

  // Advanced Alignment with Smart Distribute
  const alignObjects = (type: string) => {
    if (!canvas) return
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 2 && !type.includes('canvas')) return

    if (type.includes('canvas')) {
      // Align to canvas
      const obj = canvas.getActiveObject()
      if (!obj) return
      
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const objBounds = obj.getBoundingRect()

      switch (type) {
        case 'canvas-center':
          obj.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center',
          })
          break
      }
      obj.setCoords()
      canvas.renderAll()
      return
    }

    // Group alignment
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
  }

  // Smart Distribute
  const distributeObjects = (direction: 'horizontal' | 'vertical') => {
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 3) return

    // Sort objects by position
    const sorted = [...activeObjects].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.left - b.left
      }
      return a.top - b.top
    })

    const first = sorted[0]
    const last = sorted[sorted.length - 1]

    if (direction === 'horizontal') {
      const firstBounds = first.getBoundingRect()
      const lastBounds = last.getBoundingRect()
      const totalSpace = lastBounds.left - (firstBounds.left + firstBounds.width)
      
      let totalWidth = 0
      for (let i = 1; i < sorted.length - 1; i++) {
        totalWidth += sorted[i].getBoundingRect().width
      }
      
      const spacing = (totalSpace - totalWidth) / (sorted.length - 1)
      let currentX = firstBounds.left + firstBounds.width + spacing

      for (let i = 1; i < sorted.length - 1; i++) {
        const obj = sorted[i]
        const bounds = obj.getBoundingRect()
        obj.set({ left: obj.left + (currentX - bounds.left) })
        obj.setCoords()
        currentX += bounds.width + spacing
      }
    } else {
      // Similar logic for vertical
      const firstBounds = first.getBoundingRect()
      const lastBounds = last.getBoundingRect()
      const totalSpace = lastBounds.top - (firstBounds.top + firstBounds.height)
      
      let totalHeight = 0
      for (let i = 1; i < sorted.length - 1; i++) {
        totalHeight += sorted[i].getBoundingRect().height
      }
      
      const spacing = (totalSpace - totalHeight) / (sorted.length - 1)
      let currentY = firstBounds.top + firstBounds.height + spacing

      for (let i = 1; i < sorted.length - 1; i++) {
        const obj = sorted[i]
        const bounds = obj.getBoundingRect()
        obj.set({ top: obj.top + (currentY - bounds.top) })
        obj.setCoords()
        currentY += bounds.height + spacing
      }
    }

    canvas.renderAll()
  }

  // Auto Layout
  const applyAutoLayout = () => {
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length < 2) return

    const { direction, spacing, padding } = autoLayoutSettings

    // Create a group with auto-layout behavior
    const group = new fabric.Group(activeObjects, {
      canvas,
      subTargetCheck: true,
      interactive: true,
    })

    // Custom auto-layout logic
    let currentPos = padding
    activeObjects.forEach((obj: any, index: number) => {
      if (direction === 'horizontal') {
        obj.set({
          left: currentPos,
          top: padding,
        })
        currentPos += obj.width * obj.scaleX + spacing
      } else {
        obj.set({
          left: padding,
          top: currentPos,
        })
        currentPos += obj.height * obj.scaleY + spacing
      }
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
    toast.success('Auto layout applied')
  }

  // Boolean Operations
  const booleanOperation = (operation: 'union' | 'subtract' | 'intersect' | 'exclude') => {
    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length !== 2) {
      toast.error('Select exactly 2 objects for boolean operations')
      return
    }

    const [obj1, obj2] = activeObjects

    // This is a simplified version - full implementation would require path operations
    switch (operation) {
      case 'union':
        // Create a group that looks like a union
        const union = new fabric.Group(activeObjects, {
          canvas,
        })
        canvas.add(union)
        activeObjects.forEach(obj => canvas.remove(obj))
        canvas.setActiveObject(union)
        break
        
      case 'subtract':
        // Subtract obj2 from obj1
        toast.info('Subtract operation (visual approximation)')
        break
        
      case 'intersect':
        toast.info('Intersect operation (visual approximation)')
        break
        
      case 'exclude':
        toast.info('Exclude operation (visual approximation)')
        break
    }

    canvas.renderAll()
  }

  // Create Component/Symbol
  const createComponent = () => {
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    // Mark as component
    activeObject.set({
      isComponent: true,
      componentId: `component_${Date.now()}`,
      fill: activeObject.fill || '#9333ea',
    })

    // Add component indicator
    const indicator = new fabric.Text('◈', {
      left: activeObject.left - 20,
      top: activeObject.top - 20,
      fontSize: 16,
      fill: '#9333ea',
      selectable: false,
      evented: false,
    })

    canvas.add(indicator)
    canvas.renderAll()
    toast.success('Component created')
  }

  // Apply Effects
  const applyEffects = () => {
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    const shadows = []

    if (effects.shadow.enabled) {
      shadows.push(new fabric.Shadow({
        color: effects.shadow.color,
        blur: effects.shadow.blur,
        offsetX: effects.shadow.x,
        offsetY: effects.shadow.y,
      }))
    }

    if (shadows.length > 0) {
      activeObject.set({ shadow: shadows[0] })
    }

    if (effects.blur.enabled) {
      activeObject.set({
        filters: [
          new fabric.Image.filters.Blur({
            blur: effects.blur.amount / 10,
          }),
        ],
      })
      if (activeObject.applyFilters) {
        activeObject.applyFilters()
      }
    }

    canvas.renderAll()
    toast.success('Effects applied')
  }

  // Responsive Constraints
  const applyConstraints = () => {
    const activeObject = canvas.getActiveObject()
    if (!activeObject) return

    // Store constraints as custom properties
    activeObject.set({
      constraints: {
        horizontal: constraints.horizontal,
        vertical: constraints.vertical,
      },
    })

    // Visual indicator
    const indicator = new fabric.Rect({
      left: activeObject.left - 2,
      top: activeObject.top - 2,
      width: activeObject.width * activeObject.scaleX + 4,
      height: activeObject.height * activeObject.scaleY + 4,
      fill: 'transparent',
      stroke: '#9333ea',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    })

    canvas.add(indicator)
    setTimeout(() => canvas.remove(indicator), 2000)
    canvas.renderAll()
    toast.success('Constraints applied')
  }

  return (
    <div className="fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Tool Categories */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tools</h3>
        
        {/* Selection Tools */}
        <div className="grid grid-cols-4 gap-1 mb-4">
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
            onClick={() => setActiveTool('move')}
            className={`p-2 rounded-lg transition-all ${
              activeTool === 'move' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
            title="Move"
          >
            <Move className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTool('rotate')}
            className={`p-2 rounded-lg transition-all ${
              activeTool === 'rotate' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveTool('scale')}
            className={`p-2 rounded-lg transition-all ${
              activeTool === 'scale' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'
            }`}
            title="Scale"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Shape Tools */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Shapes</p>
          <div className="grid grid-cols-4 gap-1">
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Rectangle (R)">
              <Square className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Circle (O)">
              <Circle className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Triangle">
              <Triangle className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Star">
              <Star className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Polygon">
              <Pentagon className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Line (L)">
              <Minus className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Pen (P)">
              <PenTool className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100" title="Text (T)">
              <Type className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alignment & Distribution */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Align & Distribute</h3>
        
        <div className="space-y-2">
          {/* Alignment */}
          <div className="flex gap-1">
            <button
              onClick={() => alignObjects('left')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align left"
            >
              <AlignLeft className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => alignObjects('center-h')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align center horizontal"
            >
              <AlignCenterHorizontal className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => alignObjects('right')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align right"
            >
              <AlignRight className="h-4 w-4 mx-auto" />
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => alignObjects('top')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align top"
            >
              <AlignTop className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => alignObjects('center-v')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align center vertical"
            >
              <AlignCenterVertical className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => alignObjects('bottom')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Align bottom"
            >
              <AlignBottom className="h-4 w-4 mx-auto" />
            </button>
          </div>

          {/* Distribute */}
          <div className="flex gap-1 pt-2">
            <button
              onClick={() => distributeObjects('horizontal')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Distribute horizontal"
            >
              <AlignHorizontalDistributeCenter className="h-4 w-4 mx-auto" />
            </button>
            <button
              onClick={() => distributeObjects('vertical')}
              className="flex-1 p-2 rounded hover:bg-gray-100"
              title="Distribute vertical"
            >
              <AlignVerticalDistributeCenter className="h-4 w-4 mx-auto" />
            </button>
          </div>

          {/* Align to Canvas */}
          <button
            onClick={() => alignObjects('canvas-center')}
            className="w-full p-2 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm font-medium"
          >
            Center on Canvas
          </button>
        </div>
      </div>

      {/* Auto Layout */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Auto Layout</h3>
          <button
            onClick={() => setShowAutoLayout(!showAutoLayout)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAutoLayout ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showAutoLayout && (
          <div className="space-y-3">
            <div className="flex gap-1">
              <button
                onClick={() => setAutoLayoutSettings({ ...autoLayoutSettings, direction: 'horizontal' })}
                className={`flex-1 p-2 rounded text-sm ${
                  autoLayoutSettings.direction === 'horizontal' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <Columns className="h-4 w-4 mx-auto" />
              </button>
              <button
                onClick={() => setAutoLayoutSettings({ ...autoLayoutSettings, direction: 'vertical' })}
                className={`flex-1 p-2 rounded text-sm ${
                  autoLayoutSettings.direction === 'vertical' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <Rows className="h-4 w-4 mx-auto" />
              </button>
            </div>
            
            <div>
              <label className="text-xs text-gray-500">Spacing</label>
              <input
                type="range"
                min="0"
                max="50"
                value={autoLayoutSettings.spacing}
                onChange={(e) => setAutoLayoutSettings({ ...autoLayoutSettings, spacing: Number(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{autoLayoutSettings.spacing}px</span>
            </div>
            
            <button
              onClick={applyAutoLayout}
              className="w-full p-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium"
            >
              Apply Auto Layout
            </button>
          </div>
        )}
      </div>

      {/* Boolean Operations */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Boolean Operations</h3>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => booleanOperation('union')}
            className="p-2 rounded hover:bg-gray-100 text-sm"
            title="Union"
          >
            <GitMerge className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={() => booleanOperation('subtract')}
            className="p-2 rounded hover:bg-gray-100 text-sm"
            title="Subtract"
          >
            <GitPullRequest className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={() => booleanOperation('intersect')}
            className="p-2 rounded hover:bg-gray-100 text-sm"
            title="Intersect"
          >
            <GitCommit className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={() => booleanOperation('exclude')}
            className="p-2 rounded hover:bg-gray-100 text-sm"
            title="Exclude"
          >
            <Scissors className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* Components */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Components</h3>
        <button
          onClick={createComponent}
          className="w-full p-2 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Component className="h-4 w-4" />
          Create Component
        </button>
      </div>

      {/* Effects */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Effects</h3>
          <button
            onClick={() => setShowEffects(!showEffects)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showEffects ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showEffects && (
          <div className="space-y-3">
            {/* Shadow */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effects.shadow.enabled}
                  onChange={(e) => setEffects({
                    ...effects,
                    shadow: { ...effects.shadow, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                Drop Shadow
              </label>
              {effects.shadow.enabled && (
                <div className="mt-2 space-y-1 pl-6">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={effects.shadow.x}
                      onChange={(e) => setEffects({
                        ...effects,
                        shadow: { ...effects.shadow, x: Number(e.target.value) }
                      })}
                      className="w-16 px-2 py-1 text-xs border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      value={effects.shadow.y}
                      onChange={(e) => setEffects({
                        ...effects,
                        shadow: { ...effects.shadow, y: Number(e.target.value) }
                      })}
                      className="w-16 px-2 py-1 text-xs border rounded"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      value={effects.shadow.blur}
                      onChange={(e) => setEffects({
                        ...effects,
                        shadow: { ...effects.shadow, blur: Number(e.target.value) }
                      })}
                      className="w-16 px-2 py-1 text-xs border rounded"
                      placeholder="Blur"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Blur */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={effects.blur.enabled}
                  onChange={(e) => setEffects({
                    ...effects,
                    blur: { ...effects.blur, enabled: e.target.checked }
                  })}
                  className="rounded"
                />
                Blur
              </label>
              {effects.blur.enabled && (
                <div className="mt-2 pl-6">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={effects.blur.amount}
                    onChange={(e) => setEffects({
                      ...effects,
                      blur: { ...effects.blur, amount: Number(e.target.value) }
                    })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600">{effects.blur.amount}px</span>
                </div>
              )}
            </div>

            <button
              onClick={applyEffects}
              className="w-full p-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium"
            >
              Apply Effects
            </button>
          </div>
        )}
      </div>

      {/* Constraints */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Constraints</h3>
          <button
            onClick={() => setShowConstraints(!showConstraints)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showConstraints ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {showConstraints && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Horizontal</label>
              <select
                value={constraints.horizontal}
                onChange={(e) => setConstraints({ ...constraints, horizontal: e.target.value as any })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="center">Center</option>
                <option value="scale">Scale</option>
                <option value="leftright">Left & Right</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-gray-500">Vertical</label>
              <select
                value={constraints.vertical}
                onChange={(e) => setConstraints({ ...constraints, vertical: e.target.value as any })}
                className="w-full px-2 py-1 text-sm border rounded"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="center">Center</option>
                <option value="scale">Scale</option>
                <option value="topbottom">Top & Bottom</option>
              </select>
            </div>
            
            <button
              onClick={applyConstraints}
              className="w-full p-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm font-medium"
            >
              Apply Constraints
            </button>
          </div>
        )}
      </div>
    </div>
  )
}