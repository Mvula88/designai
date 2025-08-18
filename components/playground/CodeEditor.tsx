'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import {
  FileCode,
  FolderTree,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Settings,
} from 'lucide-react'

interface CodeEditorProps {
  files: Record<string, string>
  selectedFile: string
  onFileSelect: (file: string) => void
  onCodeChange: (file: string, code: string) => void
}

export default function CodeEditor({
  files,
  selectedFile,
  onFileSelect,
  onCodeChange,
}: CodeEditorProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'components']))
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  // Organize files into a tree structure
  const fileTree = organizeFilesIntoTree(files)

  function organizeFilesIntoTree(files: Record<string, string>) {
    const tree: any = {}
    
    Object.keys(files).forEach((path) => {
      const parts = path.split('/')
      let current = tree
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = { type: 'file', path }
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} }
          }
          current = current[part].children
        }
      })
    })
    
    return tree
  }

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  const createNewFile = () => {
    if (!newFileName) return
    
    const fullPath = newFileName.includes('/') ? newFileName : `app/${newFileName}`
    onCodeChange(fullPath, '')
    onFileSelect(fullPath)
    setNewFileName('')
    setShowNewFileModal(false)
  }

  const deleteFile = (file: string) => {
    if (confirm(`Delete ${file}?`)) {
      const newFiles = { ...files }
      delete newFiles[file]
      
      // Select another file if the deleted one was selected
      if (selectedFile === file) {
        const remainingFiles = Object.keys(newFiles)
        if (remainingFiles.length > 0) {
          onFileSelect(remainingFiles[0])
        }
      }
    }
  }

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      scss: 'scss',
      html: 'html',
      md: 'markdown',
      sql: 'sql',
      env: 'plaintext',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  const renderFileTree = (tree: any, path = '') => {
    return Object.entries(tree).map(([name, item]: [string, any]) => {
      const fullPath = path ? `${path}/${name}` : name
      
      if (item.type === 'file') {
        return (
          <div
            key={item.path}
            className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-800 cursor-pointer group ${
              selectedFile === item.path ? 'bg-gray-800 text-white' : 'text-gray-400'
            }`}
            onClick={() => onFileSelect(item.path)}
          >
            <File className="h-4 w-4" />
            <span className="text-sm flex-1">{name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFile(item.path)
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      } else {
        const isExpanded = expandedFolders.has(fullPath)
        return (
          <div key={fullPath}>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-gray-400"
              onClick={() => toggleFolder(fullPath)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
              <span className="text-sm">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {renderFileTree(item.children, fullPath)}
              </div>
            )}
          </div>
        )
      }
    })
  }

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div className="w-64 border-r border-gray-800 bg-gray-950">
        <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FolderTree className="h-4 w-4" />
            <span>Explorer</span>
          </div>
          <button
            onClick={() => setShowNewFileModal(true)}
            className="text-gray-400 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto py-2">
          {renderFileTree(fileTree)}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">{selectedFile}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {getFileLanguage(selectedFile).toUpperCase()}
            </span>
          </div>
        </div>
        <Editor
          height="calc(100% - 40px)"
          language={getFileLanguage(selectedFile)}
          value={files[selectedFile] || ''}
          onChange={(value) => onCodeChange(selectedFile, value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewFile()
                if (e.key === 'Escape') setShowNewFileModal(false)
              }}
              placeholder="e.g., components/Button.tsx"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}