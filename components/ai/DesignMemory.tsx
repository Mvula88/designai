'use client'

import { useState, useEffect } from 'react'
import {
  learnFromUserActions,
  getPersonalizedSuggestions,
  predictNextAction,
} from '@/lib/anthropic/memory'
import { createClient } from '@/lib/supabase/client'
import {
  Brain,
  Sparkles,
  TrendingUp,
  Palette,
  Type,
  Layout,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface DesignMemoryProps {
  canvas: any
  designId: string
}

export function DesignMemory({ canvas, designId }: DesignMemoryProps) {
  const [learning, setLearning] = useState(false)
  const [preferences, setPreferences] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [nextPrediction, setNextPrediction] = useState<any>(null)
  const [recentActions, setRecentActions] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (canvas && designId) {
      loadUserPreferences()
      trackCanvasActions()
    }
  }, [canvas, designId])

  const loadUserPreferences = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false })
      .limit(5)

    if (data) {
      setPreferences(data)
      loadPersonalizedSuggestions(user.id)
    }
  }

  const loadPersonalizedSuggestions = async (userId: string) => {
    if (!canvas) return

    try {
      const canvasState = canvas.toJSON()
      const newSuggestions = await getPersonalizedSuggestions(
        userId,
        canvasState
      )
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    }
  }

  const trackCanvasActions = () => {
    if (!canvas) return

    // Track object modifications
    canvas.on('object:modified', async (e: any) => {
      const action = {
        action_type: 'object_modified',
        object_type: e.target?.type,
        timestamp: new Date().toISOString(),
        data: {
          object: e.target?.toJSON(),
        },
      }

      setRecentActions((prev) => [...prev.slice(-19), action])

      // Predict next action
      if (recentActions.length > 3) {
        predictNext()
      }
    })

    // Track color changes
    canvas.on('path:created', (e: any) => {
      const action = {
        action_type: 'drawing',
        object_type: 'path',
        timestamp: new Date().toISOString(),
        data: {
          color: e.path?.stroke,
          width: e.path?.strokeWidth,
        },
      }
      setRecentActions((prev) => [...prev.slice(-19), action])
    })
  }

  const learnFromActions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !canvas) return

    setLearning(true)
    try {
      // Get recent canvas actions
      const { data: actions } = await supabase
        .from('canvas_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('design_id', designId)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (actions && actions.length > 0) {
        const canvasState = canvas.toJSON()
        const memory = await learnFromUserActions(user.id, actions, canvasState)

        setPreferences(memory.preferences)
        toast.success('Learning complete! Your preferences have been updated.')

        // Refresh suggestions
        await loadPersonalizedSuggestions(user.id)
      } else {
        toast.info('Not enough data yet. Keep designing!')
      }
    } catch (error) {
      console.error('Learning failed:', error)
      toast.error('Failed to learn from actions')
    } finally {
      setLearning(false)
    }
  }

  const predictNext = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !canvas) return

    try {
      const canvasState = {
        activeObject: canvas.getActiveObject()?.toJSON(),
      }

      const prediction = await predictNextAction(
        user.id,
        recentActions,
        canvasState
      )

      setNextPrediction(prediction)
    } catch (error) {
      console.error('Prediction failed:', error)
    }
  }

  const getPreferenceIcon = (type: string) => {
    switch (type) {
      case 'color_palette':
        return <Palette className="h-4 w-4" />
      case 'font_choice':
        return <Type className="h-4 w-4" />
      case 'layout_style':
        return <Layout className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* AI Memory Header */}
      <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">AI Design Memory</h3>
        </div>
        <p className="text-sm text-gray-600">
          Claude learns your design preferences to provide better suggestions
        </p>
        <button
          onClick={learnFromActions}
          disabled={learning}
          className="mt-3 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:bg-gray-400"
        >
          {learning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Learning...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Learn from My Style
            </>
          )}
        </button>
      </div>

      {/* Learned Preferences */}
      {preferences.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h4 className="mb-3 font-medium">Your Design DNA</h4>
          <div className="space-y-2">
            {preferences.map((pref, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="rounded bg-purple-100 p-1">
                  {getPreferenceIcon(pref.preference_type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {pref.preference_type.replace('_', ' ')}
                  </p>
                  <div className="text-xs text-gray-600">
                    {pref.preference_type === 'color_palette' && (
                      <div className="mt-1 flex gap-1">
                        {pref.preference_data.colors
                          ?.slice(0, 5)
                          .map((color: string, j: number) => (
                            <div
                              key={j}
                              className="h-6 w-6 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                      </div>
                    )}
                    {pref.preference_type === 'font_choice' && (
                      <span>{pref.preference_data.fonts?.join(', ')}</span>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <span>
                        Confidence: {Math.round(pref.confidence_score * 100)}%
                      </span>
                      <span>•</span>
                      <span>Used {pref.usage_count} times</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Action Prediction */}
      {nextPrediction && nextPrediction.confidence > 0.6 && (
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">
              Next Step Prediction
            </h4>
          </div>
          <p className="text-sm text-blue-700">{nextPrediction.action}</p>
          <p className="mt-1 text-xs text-blue-600">
            Confidence: {Math.round(nextPrediction.confidence * 100)}%
          </p>
        </div>
      )}

      {/* Personalized Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h4 className="mb-3 font-medium">Suggestions Based on Your Style</h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="rounded-lg border-l-2 border-purple-500 bg-gradient-to-r from-purple-50 to-transparent p-3"
              >
                <p className="text-sm text-gray-700">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Actions */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h4 className="mb-3 font-medium">Recent Actions</h4>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {recentActions
            .slice(-5)
            .reverse()
            .map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <span className="text-gray-400">
                  {new Date(action.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-medium">{action.action_type}</span>
                {action.object_type && (
                  <span className="text-gray-500">({action.object_type})</span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
