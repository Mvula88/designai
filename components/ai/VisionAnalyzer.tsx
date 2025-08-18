'use client'

import { useState, useCallback } from 'react'
import { analyzeImageWithClaude } from '@/lib/anthropic/vision'
import { Upload, Loader2, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'

export function VisionAnalyzer({
  onAnalysisComplete,
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
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
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
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Eye className="h-5 w-5 text-blue-500" />
          Design Archaeology
        </h3>

        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />

          {analyzing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">
                Analyzing design with Claude Vision...
              </p>
            </div>
          ) : imagePreview ? (
            <div className="space-y-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="mx-auto max-h-32 rounded"
              />
              <p className="text-sm text-gray-600">
                Drop another image to analyze
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
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
        <div className="rounded-lg bg-white p-4 shadow">
          <h4 className="mb-3 font-medium">Analysis Results</h4>

          <div className="space-y-3">
            {/* Description */}
            <div>
              <p className="text-sm font-medium text-gray-700">Description:</p>
              <p className="text-sm text-gray-600">
                {analysisResult.description}
              </p>
            </div>

            {/* Elements Found */}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Elements Found: {analysisResult.elements?.length || 0}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {analysisResult.elements?.map((el: any, i: number) => (
                  <span
                    key={i}
                    className="rounded bg-gray-100 px-2 py-1 text-xs"
                  >
                    {el.type}
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Color Palette:
              </p>
              <div className="mt-1 flex gap-2">
                {analysisResult.colors?.map((color: string, i: number) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {analysisResult.suggestions && (
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Suggestions:
                </p>
                <ul className="list-inside list-disc text-sm text-gray-600">
                  {analysisResult.suggestions.map(
                    (suggestion: string, i: number) => (
                      <li key={i}>{suggestion}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Apply Button */}
            <button
              onClick={applyToCanvas}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Apply to Canvas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
