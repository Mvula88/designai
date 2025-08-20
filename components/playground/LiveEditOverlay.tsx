'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Edit3, 
  Type, 
  Image, 
  Square, 
  Circle, 
  Triangle,
  Move,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Link,
  Trash2,
  Copy,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Settings,
  X,
  Check,
  Undo,
  Redo,
  Save
} from 'lucide-react'
import { toast } from 'sonner'

interface LiveEditOverlayProps {
  isActive: boolean
  onToggle: () => void
  onElementEdit: (elementPath: string, changes: any) => void
  selectedElement: any
}

export default function LiveEditOverlay({ 
  isActive, 
  onToggle, 
  onElementEdit,
  selectedElement 
}: LiveEditOverlayProps) {
  const [editMode, setEditMode] = useState<'select' | 'text' | 'style' | 'layout'>('select')
  const [showToolbar, setShowToolbar] = useState(true)
  const [showProperties, setShowProperties] = useState(false)
  const [editingText, setEditingText] = useState('')
  const [styles, setStyles] = useState<any>({})
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  useEffect(() => {
    if (selectedElement) {
      setEditingText(selectedElement.text || '')
      setStyles(selectedElement.styles || {})
      setShowProperties(true)
    }
  }, [selectedElement])

  const handleStyleChange = (property: string, value: string) => {
    const newStyles = { ...styles, [property]: value }
    setStyles(newStyles)
    onElementEdit(selectedElement.path, { styles: newStyles })
    addToHistory({ path: selectedElement.path, styles: newStyles })
  }

  const handleTextChange = (newText: string) => {
    setEditingText(newText)
    onElementEdit(selectedElement.path, { text: newText })
    addToHistory({ path: selectedElement.path, text: newText })
  }

  const addToHistory = (change: any) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(change)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      const prevState = history[historyIndex - 1]
      onElementEdit(prevState.path, prevState)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      const nextState = history[historyIndex + 1]
      onElementEdit(nextState.path, nextState)
    }
  }

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
      >
        <Edit3 className="h-4 w-4" />
        Enable Live Edit
      </button>
    )
  }

  return (
    <>
      {/* Main Toolbar */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all ${showToolbar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 flex items-center gap-1">
          {/* Mode Selection */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1 mr-2">
            <button
              onClick={() => setEditMode('select')}
              className={`p-2 rounded-md transition-all ${editMode === 'select' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Select Mode"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditMode('text')}
              className={`p-2 rounded-md transition-all ${editMode === 'text' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Text Mode"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditMode('style')}
              className={`p-2 rounded-md transition-all ${editMode === 'style' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Style Mode"
            >
              <Palette className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditMode('layout')}
              className={`p-2 rounded-md transition-all ${editMode === 'layout' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Layout Mode"
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>

          {/* Text Formatting */}
          {editMode === 'text' && (
            <>
              <div className="h-6 w-px bg-gray-700 mx-1" />
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Bold className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Italic className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Underline className="h-4 w-4" />
              </button>
              <div className="h-6 w-px bg-gray-700 mx-1" />
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <AlignLeft className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <AlignCenter className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <AlignRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Style Tools */}
          {editMode === 'style' && (
            <>
              <div className="h-6 w-px bg-gray-700 mx-1" />
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer"
                title="Background Color"
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              />
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer"
                title="Text Color"
                onChange={(e) => handleStyleChange('color', e.target.value)}
              />
              <select
                className="px-2 py-1 bg-gray-800 text-gray-300 rounded-md text-sm"
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
            </>
          )}

          {/* Layout Tools */}
          {editMode === 'layout' && (
            <>
              <div className="h-6 w-px bg-gray-700 mx-1" />
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Square className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Circle className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Triangle className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                <Image className="h-4 w-4" />
              </button>
            </>
          )}

          <div className="h-6 w-px bg-gray-700 mx-1" />

          {/* History Controls */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Redo className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-gray-700 mx-1" />

          {/* Action Buttons */}
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
            <Copy className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all">
            <Trash2 className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-gray-700 mx-1" />

          <button
            onClick={onToggle}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-md transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && selectedElement && (
        <div className="fixed right-4 top-20 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Properties</h3>
              <button
                onClick={() => setShowProperties(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Element Info */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Element Type</label>
              <div className="px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300">
                {selectedElement.type || 'div'}
              </div>
            </div>

            {/* Text Content */}
            {editMode === 'text' && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Text Content</label>
                <textarea
                  value={editingText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Style Properties */}
            {editMode === 'style' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Padding</label>
                  <input
                    type="text"
                    value={styles.padding || ''}
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                    placeholder="e.g., 10px"
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Margin</label>
                  <input
                    type="text"
                    value={styles.margin || ''}
                    onChange={(e) => handleStyleChange('margin', e.target.value)}
                    placeholder="e.g., 10px"
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Border Radius</label>
                  <input
                    type="text"
                    value={styles.borderRadius || ''}
                    onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                    placeholder="e.g., 8px"
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  />
                </div>
              </>
            )}

            {/* Layout Properties */}
            {editMode === 'layout' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Width</label>
                  <input
                    type="text"
                    value={styles.width || ''}
                    onChange={(e) => handleStyleChange('width', e.target.value)}
                    placeholder="e.g., 100% or 200px"
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Height</label>
                  <input
                    type="text"
                    value={styles.height || ''}
                    onChange={(e) => handleStyleChange('height', e.target.value)}
                    placeholder="e.g., auto or 100px"
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Display</label>
                  <select
                    value={styles.display || 'block'}
                    onChange={(e) => handleStyleChange('display', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm"
                  >
                    <option value="block">Block</option>
                    <option value="inline-block">Inline Block</option>
                    <option value="flex">Flex</option>
                    <option value="grid">Grid</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </>
            )}

            {/* Apply Button */}
            <button
              onClick={() => toast.success('Changes applied')}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Mode Indicator */}
      <div className="fixed bottom-4 left-4 z-40 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-300">Live Edit Mode: {editMode}</span>
        </div>
      </div>
    </>
  )
}