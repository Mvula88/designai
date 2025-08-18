'use client'

import { useState, useCallback } from 'react'
import { analyzeImageWithClaude } from '@/lib/anthropic/vision'
import { Upload, Loader2, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

export function VisionAnalyzer({ 
  onAnalysisComplete 
}: { 
  onAnalysisComplete: (fabricObjects: any[]) => void 
}) {
  const [analyzing, setAnalyzing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Analyze image
    setAnalyzing(true)
    try {
      // Upload to temporary storage or use data URL
      const result = await analyzeImageWithClaude(
        URL.createObjectURL(file),
        'design_archaeology'
      )
      
      setAnalysisResult(result)
      
      if (result.fabricObjects) {
        toast.success('Design analyzed successfully!')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1
  })

  const applyToCanvas = () => {
    if (analysisResult?.fabricObjects) {
      onAnalysisComplete(analysisResult.fabricObjects)
      toast.success('Design elements added to canvas')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          Design Archaeology
        </h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {analyzing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">Analyzing design with Claude Vision...</p>
            </div>
          ) : imagePreview ? (
            <div className="space-y-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 mx-auto rounded"
              />
              <p className="text-sm text-gray-600">Drop another image to analyze</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive 
                  ? 'Drop the image here...' 
                  : 'Drag & drop an image, or click to select'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h4 className="font-medium mb-3">Analysis Results</h4>
          
          <div className="space-y-3">
            {/* Description */}
            <div>
              <p className="text-sm font-medium text-gray-700">Description:</p>
              <p className="text-sm text-gray-600">{analysisResult.description}</p>
            </div>

            {/* Elements Found */}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Elements Found: {analysisResult.elements?.length || 0}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysisResult.elements?.map((el: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {el.type}
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-sm font-medium text-gray-700">Color Palette:</p>
              <div className="flex gap-2 mt-1">
                {analysisResult.colors?.map((color: string, i: number) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {analysisResult.suggestions && (
              <div>
                <p className="text-sm font-medium text-gray-700">Suggestions:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {analysisResult.suggestions.map((suggestion: string, i: number) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={applyToCanvas}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Apply to Canvas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}