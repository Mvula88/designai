'use client'

import { useState, useEffect } from 'react'
import { predictDesignPerformance } from '@/lib/anthropic/performance'
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  Eye,
  MousePointer,
  Accessibility,
  BookOpen,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface PerformancePanelProps {
  designId: string
  canvas: any
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
        designId,
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

  const metrics = prediction
    ? [
        {
          label: 'Engagement',
          value: prediction.engagementScore,
          icon: <Eye className="h-4 w-4" />,
          description: 'Visual appeal and attention-grabbing potential',
        },
        {
          label: 'Click Rate',
          value: Math.round(prediction.clickProbability * 100),
          icon: <MousePointer className="h-4 w-4" />,
          description: 'Likelihood of user interaction',
        },
        {
          label: 'Conversion',
          value: Math.round(prediction.conversionEstimate * 100),
          icon: <TrendingUp className="h-4 w-4" />,
          description: 'Probability of achieving goal',
        },
        {
          label: 'Accessibility',
          value: prediction.accessibilityScore,
          icon: <Accessibility className="h-4 w-4" />,
          description: 'Compliance with accessibility standards',
        },
        {
          label: 'Readability',
          value: prediction.readabilityScore,
          icon: <BookOpen className="h-4 w-4" />,
          description: 'Text clarity and hierarchy',
        },
      ]
    : []

  const filteredSuggestions =
    prediction?.suggestions?.filter(
      (s: any) => selectedCategory === 'all' || s.category === selectedCategory
    ) || []

  return (
    <div className="space-y-4">
      {/* Analyze Button */}
      {!prediction && (
        <div className="rounded-lg bg-white p-4 text-center shadow">
          <BarChart3 className="mx-auto mb-3 h-12 w-12 text-purple-500" />
          <h3 className="mb-2 font-semibold">Performance Prediction</h3>
          <p className="mb-4 text-sm text-gray-600">
            AI analyzes your design to predict engagement and conversion metrics
          </p>
          <button
            onClick={analyzePerformance}
            disabled={loading || !canvas}
            className="mx-auto flex items-center justify-center rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:bg-gray-400"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Analyze Performance
              </>
            )}
          </button>
        </div>
      )}

      {/* Metrics Dashboard */}
      {prediction && (
        <>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="mb-4 flex items-center justify-between">
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
                      <div
                        className={`rounded p-1 ${getScoreBg(metric.value)}`}
                      >
                        {metric.icon}
                      </div>
                      <span className="text-sm font-medium">
                        {metric.label}
                      </span>
                    </div>
                    <span
                      className={`text-lg font-bold ${getScoreColor(metric.value)}`}
                    >
                      {metric.value}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.value >= 80
                          ? 'bg-green-500'
                          : metric.value >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
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
            <div className="rounded-lg bg-green-50 p-3">
              <h4 className="mb-2 flex items-center gap-1 font-medium text-green-900">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {prediction.strengths?.map((strength: string, i: number) => (
                  <li key={i} className="text-xs text-green-700">
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-red-50 p-3">
              <h4 className="mb-2 flex items-center gap-1 font-medium text-red-900">
                <AlertCircle className="h-4 w-4" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {prediction.weaknesses?.map((weakness: string, i: number) => (
                  <li key={i} className="text-xs text-red-700">
                    • {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="rounded-lg bg-white p-4 shadow">
            <h4 className="mb-3 font-semibold">Improvement Suggestions</h4>

            {/* Category Filter */}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-3 py-1 text-xs ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {[
                'layout',
                'color',
                'typography',
                'accessibility',
                'content',
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs capitalize ${
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
                  className={`rounded-lg border p-3 ${
                    suggestion.priority === 'high'
                      ? 'border-red-200 bg-red-50'
                      : suggestion.priority === 'medium'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            suggestion.priority === 'high'
                              ? 'bg-red-200 text-red-700'
                              : suggestion.priority === 'medium'
                                ? 'bg-yellow-200 text-yellow-700'
                                : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {suggestion.priority}
                        </span>
                        <span className="text-xs capitalize text-gray-500">
                          {suggestion.category}
                        </span>
                      </div>
                      <p className="mb-1 text-sm font-medium text-gray-900">
                        {suggestion.issue}
                      </p>
                      <p className="mb-1 text-xs text-gray-600">
                        {suggestion.suggestion}
                      </p>
                      <p className="text-xs text-purple-600">
                        Impact: {suggestion.impact}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
