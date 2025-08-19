'use client'

import { useState } from 'react'
import {
  X,
  Upload,
  Link,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  FileImage,
  Sparkles,
  ExternalLink,
  Copy,
  Key,
  Cloud,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface DesignImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => void
}

type ImportSource = 'figma' | 'sketch' | 'canva' | 'upload' | null

export default function DesignImportModal({ isOpen, onClose, onImport }: DesignImportModalProps) {
  const [selectedSource, setSelectedSource] = useState<ImportSource>(null)
  const [importing, setImporting] = useState(false)
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaToken, setFigmaToken] = useState('')
  const [canvaUrl, setCanvaUrl] = useState('')
  const [sketchFile, setSketchFile] = useState<File | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [step, setStep] = useState<'select' | 'configure' | 'importing'>('select')

  if (!isOpen) return null

  const importSources = [
    {
      id: 'figma' as ImportSource,
      name: 'Figma',
      description: 'Import directly from Figma files',
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 38 57" fill="none">
          <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
          <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
          <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
          <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
          <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      popular: true
    },
    {
      id: 'sketch' as ImportSource,
      name: 'Sketch',
      description: 'Upload .sketch files',
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 394 356" fill="none">
          <path d="M85.79 11L196.53 0L306.21 11L393 102.54L196.53 355.72L0 102.54L85.79 11Z" fill="#FDB300"/>
          <path d="M85.79 11L196.53 102.54L0 102.54L85.79 11Z" fill="#EA6C00"/>
          <path d="M306.21 11L196.53 102.54L393 102.54L306.21 11Z" fill="#EA6C00"/>
          <path d="M85.79 11L196.53 102.54L306.21 11" fill="#FDAD00"/>
          <path d="M196.53 102.54L85.79 11L196.53 0L306.21 11L196.53 102.54Z" fill="#FDD231"/>
          <path d="M196.53 355.72L0 102.54L196.53 102.54" fill="#FDAD00"/>
          <path d="M196.53 355.72L393 102.54L196.53 102.54" fill="#FDAD00"/>
          <path d="M196.53 355.72L196.53 102.54L0 102.54" fill="#FEEEB7"/>
          <path d="M196.53 355.72L196.53 102.54L393 102.54" fill="#FEEEB7"/>
        </svg>
      ),
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'canva' as ImportSource,
      name: 'Canva',
      description: 'Import from Canva designs',
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="100" fill="url(#canva-gradient)"/>
          <path d="M145 105C145 127.091 127.091 145 105 145C82.9086 145 65 127.091 65 105C65 82.9086 82.9086 65 105 65C127.091 65 145 82.9086 145 105Z" fill="white"/>
          <path d="M95 55C95 71.5685 81.5685 85 65 85C48.4315 85 35 71.5685 35 55C35 38.4315 48.4315 25 65 25C81.5685 25 95 38.4315 95 55Z" fill="white"/>
          <path d="M165 145C165 161.569 151.569 175 135 175C118.431 175 105 161.569 105 145C105 128.431 118.431 115 135 115C151.569 115 165 128.431 165 145Z" fill="white"/>
          <defs>
            <linearGradient id="canva-gradient" x1="0" y1="0" x2="200" y2="200">
              <stop stopColor="#00C4CC"/>
              <stop offset="1" stopColor="#7D2AE7"/>
            </linearGradient>
          </defs>
        </svg>
      ),
      color: 'from-cyan-500 to-purple-500',
      popular: true
    },
    {
      id: 'upload' as ImportSource,
      name: 'Upload Image',
      description: 'PNG, JPG, or SVG files',
      icon: <FileImage className="h-8 w-8" />,
      color: 'from-gray-500 to-gray-600'
    }
  ]

  const handleFigmaImport = async () => {
    if (!figmaUrl) {
      toast.error('Please enter a Figma file URL')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      // Extract file key from Figma URL
      const fileKey = figmaUrl.match(/file\/([a-zA-Z0-9]+)/)?.[1]
      if (!fileKey) {
        throw new Error('Invalid Figma URL')
      }

      // Call API to import from Figma
      const response = await fetch('/api/import/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey,
          accessToken: figmaToken || process.env.NEXT_PUBLIC_FIGMA_TOKEN
        })
      })

      if (!response.ok) throw new Error('Failed to import from Figma')

      const data = await response.json()
      onImport(data)
      toast.success('Design imported from Figma!')
      onClose()
    } catch (error) {
      console.error('Figma import error:', error)
      toast.error('Failed to import from Figma')
    } finally {
      setImporting(false)
      setStep('configure')
    }
  }

  const handleSketchImport = async () => {
    if (!sketchFile) {
      toast.error('Please select a Sketch file')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      const formData = new FormData()
      formData.append('file', sketchFile)

      const response = await fetch('/api/import/sketch', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to import Sketch file')

      const data = await response.json()
      onImport(data)
      toast.success('Design imported from Sketch!')
      onClose()
    } catch (error) {
      console.error('Sketch import error:', error)
      toast.error('Failed to import Sketch file')
    } finally {
      setImporting(false)
      setStep('configure')
    }
  }

  const handleCanvaImport = async () => {
    if (!canvaUrl) {
      toast.error('Please enter a Canva design URL')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      const response = await fetch('/api/import/canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canvaUrl })
      })

      if (!response.ok) throw new Error('Failed to import from Canva')

      const data = await response.json()
      onImport(data)
      toast.success('Design imported from Canva!')
      onClose()
    } catch (error) {
      console.error('Canva import error:', error)
      toast.error('Failed to import from Canva')
    } finally {
      setImporting(false)
      setStep('configure')
    }
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file')
      return
    }

    setImporting(true)
    setStep('importing')

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/import/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to import image')

      const data = await response.json()
      onImport(data)
      toast.success('Design imported successfully!')
      onClose()
    } catch (error) {
      console.error('File import error:', error)
      toast.error('Failed to import file')
    } finally {
      setImporting(false)
      setStep('configure')
    }
  }

  const handleImport = () => {
    switch (selectedSource) {
      case 'figma':
        handleFigmaImport()
        break
      case 'sketch':
        handleSketchImport()
        break
      case 'canva':
        handleCanvaImport()
        break
      case 'upload':
        handleFileUpload()
        break
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Import Your Design</h2>
              <p className="text-purple-100">
                Bring your existing designs from your favorite tools
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {importSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => {
                      setSelectedSource(source.id)
                      setStep('configure')
                    }}
                    className={`relative p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                      selectedSource === source.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {source.popular && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded-full">
                        Popular
                      </span>
                    )}
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${source.color} mb-3`}>
                      <div className="text-white">{source.icon}</div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{source.name}</h3>
                    <p className="text-sm text-gray-600">{source.description}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">AI-Powered Conversion</h4>
                    <p className="text-sm text-gray-600">
                      Our AI automatically converts your designs into editable components,
                      preserving layouts, styles, and interactions.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'configure' && (
            <>
              {selectedSource === 'figma' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Figma File URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={figmaUrl}
                        onChange={(e) => setFigmaUrl(e.target.value)}
                        placeholder="https://www.figma.com/file/..."
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <Link className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Paste the URL of your Figma file (must have view access)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Access Token (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={figmaToken}
                        onChange={(e) => setFigmaToken(e.target.value)}
                        placeholder="Your Figma access token"
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <Key className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      For private files, generate a token from Figma settings
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      How to get your Figma file URL:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Open your design in Figma</li>
                      <li>Click "Share" button in the top right</li>
                      <li>Copy the link and paste it here</li>
                    </ol>
                  </div>
                </div>
              )}

              {selectedSource === 'sketch' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Sketch File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept=".sketch"
                        onChange={(e) => setSketchFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="sketch-upload"
                      />
                      <label htmlFor="sketch-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">
                          {sketchFile ? sketchFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500">.sketch files only (max 50MB)</p>
                      </label>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Note:</h4>
                    <p className="text-sm text-yellow-700">
                      Make sure your Sketch file contains artboards and properly named layers
                      for best conversion results.
                    </p>
                  </div>
                </div>
              )}

              {selectedSource === 'canva' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canva Design URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={canvaUrl}
                        onChange={(e) => setCanvaUrl(e.target.value)}
                        placeholder="https://www.canva.com/design/..."
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <Link className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Share your Canva design and paste the public link here
                    </p>
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4">
                    <h4 className="font-medium text-cyan-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      How to share from Canva:
                    </h4>
                    <ol className="text-sm text-cyan-700 space-y-1 list-decimal list-inside">
                      <li>Open your design in Canva</li>
                      <li>Click "Share" → "More" → "Publish"</li>
                      <li>Choose "Website" and copy the link</li>
                    </ol>
                  </div>
                </div>
              )}

              {selectedSource === 'upload' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Design Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*,.svg"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">
                          {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-gray-500">PNG, JPG, or SVG (max 10MB)</p>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => {
                    setStep('select')
                    setSelectedSource(null)
                  }}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import Design
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="relative inline-flex">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-50 animate-pulse" />
                <Sparkles className="relative h-16 w-16 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
                Importing Your Design
              </h3>
              <p className="text-gray-600">
                Our AI is analyzing and converting your design...
              </p>
              <div className="mt-8 space-y-2 max-w-sm mx-auto">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Extracting design elements</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-4 w-4 border-2 border-purple-600 rounded-full animate-spin" />
                  <span className="text-gray-700">Converting to components</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                  <span>Optimizing for production</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}