'use client'

import { useState, useRef } from 'react'
import JSZip from 'jszip'
import {
  Upload,
  FileArchive,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Folder,
  Code2,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'

interface ZipUploadProps {
  onFilesExtracted: (files: Record<string, string>) => void
  onClose: () => void
}

interface FileItem {
  path: string
  content: string
  size: number
  type: 'file' | 'folder'
}

export default function ZipUpload({ onFilesExtracted, onClose }: ZipUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedFiles, setExtractedFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const zipFile = files.find(f => f.name.endsWith('.zip'))
    
    if (zipFile) {
      await processZipFile(zipFile)
    } else {
      toast.error('Please upload a ZIP file')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.zip')) {
      await processZipFile(file)
    } else {
      toast.error('Please select a ZIP file')
    }
  }

  const processZipFile = async (file: File) => {
    setIsProcessing(true)
    setExtractedFiles([])
    setSelectedFiles(new Set())

    try {
      const zip = new JSZip()
      const contents = await zip.loadAsync(file)
      
      const files: FileItem[] = []
      const allowedExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', 
        '.html', '.md', '.txt', '.env', '.yml', '.yaml', '.toml'
      ]

      // Extract files
      for (const [path, file] of Object.entries(contents.files)) {
        // Skip directories and hidden files
        if (file.dir || path.startsWith('.') || path.includes('/.')) continue
        
        // Skip node_modules and other build directories
        if (path.includes('node_modules/') || 
            path.includes('dist/') || 
            path.includes('build/') ||
            path.includes('.next/') ||
            path.includes('.git/')) continue

        // Check if file has allowed extension
        const hasAllowedExtension = allowedExtensions.some(ext => path.endsWith(ext))
        if (!hasAllowedExtension && !path.includes('package.json')) continue

        try {
          const content = await file.async('string')
          
          // Skip very large files (> 1MB)
          if (content.length > 1024 * 1024) continue
          
          files.push({
            path,
            content,
            size: content.length,
            type: 'file'
          })

          // Auto-select important files
          if (path === 'package.json' || 
              path === 'app/page.tsx' || 
              path === 'pages/index.tsx' ||
              path === 'src/App.tsx' ||
              path === 'src/App.js' ||
              path === 'index.html') {
            setSelectedFiles(prev => new Set([...prev, path]))
          }
        } catch (err) {
          console.error(`Failed to extract ${path}:`, err)
        }
      }

      if (files.length === 0) {
        toast.error('No valid files found in ZIP')
        setIsProcessing(false)
        return
      }

      setExtractedFiles(files)
      toast.success(`Extracted ${files.length} files from ZIP`)
    } catch (error) {
      console.error('Failed to process ZIP file:', error)
      toast.error('Failed to process ZIP file')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleFileSelection = (path: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedFiles(new Set(extractedFiles.map(f => f.path)))
  }

  const deselectAll = () => {
    setSelectedFiles(new Set())
  }

  const importSelectedFiles = () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select at least one file to import')
      return
    }

    const filesToImport: Record<string, string> = {}
    
    extractedFiles.forEach(file => {
      if (selectedFiles.has(file.path)) {
        filesToImport[file.path] = file.content
      }
    })

    onFilesExtracted(filesToImport)
    toast.success(`Imported ${selectedFiles.size} files`)
    onClose()
  }

  const getFileIcon = (path: string) => {
    if (path.endsWith('.json')) return Package
    if (path.endsWith('.md') || path.endsWith('.txt')) return FileText
    return Code2
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20">
                <FileArchive className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Import from ZIP</h2>
                <p className="text-sm text-gray-400">Upload a ZIP file containing your project</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {extractedFiles.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-white font-medium">Processing ZIP file...</p>
                  <p className="text-sm text-gray-400 mt-2">Extracting and analyzing files</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Drop your ZIP file here
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    or click to browse your files
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                  >
                    Choose ZIP File
                  </button>
                  <p className="text-xs text-gray-500 mt-4">
                    Supports: JavaScript, TypeScript, React, Next.js, and more
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {selectedFiles.size} of {extractedFiles.length} files selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-all"
                  >
                    Choose Another
                  </button>
                </div>
              </div>

              {/* File List */}
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {extractedFiles.map((file) => {
                    const Icon = getFileIcon(file.path)
                    const isSelected = selectedFiles.has(file.path)
                    
                    return (
                      <div
                        key={file.path}
                        onClick={() => toggleFileSelection(file.path)}
                        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-600/10 hover:bg-purple-600/20'
                            : 'hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-purple-400" />
                          ) : (
                            <div className="w-5 h-5 border border-gray-600 rounded" />
                          )}
                        </div>
                        <Icon className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-white font-mono">{file.path}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                  <div className="text-xs text-gray-400">
                    <p className="font-medium text-yellow-400 mb-1">Important:</p>
                    <ul className="space-y-1">
                      <li>• Large files (&gt;1MB) are automatically excluded</li>
                      <li>• Binary files and dependencies are skipped</li>
                      <li>• Select only the files you need for your playground</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {extractedFiles.length > 0 && (
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={importSelectedFiles}
                disabled={selectedFiles.size === 0}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {selectedFiles.size > 0 ? `${selectedFiles.size} Files` : 'Selected Files'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}