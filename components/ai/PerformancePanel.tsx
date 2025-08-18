'use client'

import { useState, useEffect } from 'react'
import { predictDesignPerformance } from '@/lib/anthropic/performance'
import { 
  TrendingUp, AlertCircle, CheckCircle, BarChart3, 
  Zap, Eye, MousePointer, Accessibility, BookOpen,
  ChevronRight, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformancePanelProps {
  designId: string
  canvas: fabric.Canvas | null
}

export function PerformancePanel({ designId, canvas }: PerformancePanelProps) {
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const analyzePerformance = async () => {
    if (!canvas) return

    setLoading(true)
    try {
      const canvasData = {
        ...canvas.toJSON(),
        designId
      }
      
      const result = await predictDesignPerformance(canvasData, 'general')
      setPrediction(result)
      toast.success('Performance analysis complete!')
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Failed to analyze performance')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const metrics = prediction ? [
    {
      label: 'Engagement',
      value: prediction.engagementScore,
      icon: <Eye className="w-4 h-4" />,
      description: 'Visual appeal and attention-grabbing potential'
    },
    {
      label: 'Click Rate',
      value: Math.round(prediction.clickProbability * 100),
      icon: <MousePointer className="w-4 h-4" />,
      description: 'Likelihood of user interaction'
    },
    {
      label: 'Conversion',
      value: Math.round(prediction.conversionEstimate * 100),
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Probability of achieving goal'
    },
    {
      label: 'Accessibility',
      value: prediction.accessibilityScore,
      icon: <Accessibility className="w-4 h-4" />,
      description: 'Compliance with accessibility standards'
    },
    {
      label: 'Readability',
      value: prediction.readabilityScore,
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Text clarity and hierarchy'
    }
  ] : []

  const filteredSuggestions = prediction?.suggestions?.filter((s: any) => 
    selectedCategory === 'all' || s.category === selectedCategory
  ) || []

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      {!prediction && (
        <div className="p-4 bg-white rounded-lg shadow text-center">
          <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Performance Prediction</h3>
          <p className="text-sm text-gray-600 mb-4">
            AI analyzes your design to predict engagement and conversion metrics
          </p>
          <button
            onClick={analyzePerformance}
            disabled={loading || !canvas}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze Performance
              </>
            )}
          </button>
        </div>
      )}

      {/* Metrics Dashboard */}
      {prediction && (
        <>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Performance Metrics</h3>
              <button
                onClick={analyzePerformance}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getScoreBg(metric.value)}`}>
                        {metric.icon}
                      </div>
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${getScoreColor(metric.value)}`}>
                      {metric.value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.value >= 80 ? 'bg-green-500' :
                        metric.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {prediction.strengths?.map((strength: string, i: number) => (
                  <li key={i} className="text-xs text-green-700">• {strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {prediction.weaknesses?.map((weakness: string, i: number) => (
                  <li key={i} className="text-xs text-red-700">• {weakness}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h4 className="font-semibold mb-3">Improvement Suggestions</h4>
            
            {/* Category Filter */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 text-xs rounded-full ${
                  selectedCategory === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {['layout', 'color', 'typography', 'accessibility', 'content'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs rounded-full capitalize ${
                    selectedCategory === cat 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Suggestions List */}
            <div className="space-y-2">
              {filteredSuggestions.map((suggestion: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    suggestion.priority === 'high' ? 'border-red-200 bg-red-50' :
                    suggestion.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.priority === 'high' ? 'bg-red-200 text-red-700' :
                          suggestion.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {suggestion.priority}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {suggestion.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {suggestion.issue}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">
                        {suggestion.suggestion}
                      </p>
                      <p className="text-xs text-purple-600">
                        Impact: {suggestion.impact}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}