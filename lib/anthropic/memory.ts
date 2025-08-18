import anthropic, { CLAUDE_MODELS } from './client'
import { createClient } from '@/lib/supabase/client'

interface DesignPreference {
  type: 'color_palette' | 'font_choice' | 'layout_style' | 'element_style'
  data: any
  confidence: number
  frequency: number
}

interface MemoryContext {
  recentActions: any[]
  commonPatterns: any[]
  preferences: DesignPreference[]
}

export async function learnFromUserActions(
  userId: string,
  actions: any[],
  canvasState: any
): Promise<MemoryContext> {
  const supabase = createClient()
  
  try {
    // Analyze patterns in user actions
    const prompt = `Analyze these user design actions to identify patterns and preferences.

Recent actions:
${JSON.stringify(actions.slice(-20), null, 2)}

Current canvas state:
${JSON.stringify(canvasState.objects?.slice(0, 10), null, 2)}

Identify:
1. Color preferences (most used colors)
2. Typography preferences (fonts, sizes)
3. Layout patterns (alignment, spacing)
4. Design style (minimal, bold, playful, etc.)

Return JSON with this structure:
{
  "colorPalette": ["#hex1", "#hex2"],
  "fonts": ["font1", "font2"],
  "layoutStyle": "grid|freeform|centered|asymmetric",
  "designStyle": "minimal|bold|playful|corporate|creative",
  "commonElements": ["type1", "type2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Store preferences in database
    const preferences: DesignPreference[] = []

    if (analysis.colorPalette?.length > 0) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        preference_type: 'color_palette',
        preference_data: { colors: analysis.colorPalette },
        confidence_score: 0.7,
        usage_count: actions.filter(a => a.action_type === 'color_change').length
      })
      
      preferences.push({
        type: 'color_palette',
        data: { colors: analysis.colorPalette },
        confidence: 0.7,
        frequency: actions.filter(a => a.action_type === 'color_change').length
      })
    }

    if (analysis.fonts?.length > 0) {
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        preference_type: 'font_choice',
        preference_data: { fonts: analysis.fonts },
        confidence_score: 0.6,
        usage_count: actions.filter(a => a.action_type === 'text_edit').length
      })
      
      preferences.push({
        type: 'font_choice',
        data: { fonts: analysis.fonts },
        confidence: 0.6,
        frequency: actions.filter(a => a.action_type === 'text_edit').length
      })
    }

    return {
      recentActions: actions.slice(-10),
      commonPatterns: analysis.commonElements || [],
      preferences
    }
  } catch (error) {
    console.error('Memory learning error:', error)
    return {
      recentActions: actions.slice(-10),
      commonPatterns: [],
      preferences: []
    }
  }
}

export async function getPersonalizedSuggestions(
  userId: string,
  canvasState: any
): Promise<string[]> {
  const supabase = createClient()
  
  try {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false })
      .limit(5)

    if (!preferences || preferences.length === 0) {
      return getDefaultSuggestions()
    }

    const prompt = `Based on user preferences and current design, provide personalized suggestions.

User preferences:
${JSON.stringify(preferences, null, 2)}

Current design:
${JSON.stringify(canvasState.objects?.slice(0, 5), null, 2)}

Provide 5 personalized suggestions that align with their style.
Return as JSON array of strings.`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') return getDefaultSuggestions()

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return getDefaultSuggestions()

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Personalized suggestions error:', error)
    return getDefaultSuggestions()
  }
}

function getDefaultSuggestions(): string[] {
  return [
    'Try using your favorite color palette',
    'Add more contrast to make elements pop',
    'Consider using consistent spacing',
    'Try adding a focal point to guide the eye',
    'Use hierarchy to organize information'
  ]
}

export async function predictNextAction(
  userId: string,
  recentActions: any[],
  canvasState: any
): Promise<{ action: string; confidence: number }> {
  try {
    const prompt = `Based on recent actions, predict the most likely next action.

Recent actions: ${JSON.stringify(recentActions.slice(-5), null, 2)}
Current selection: ${JSON.stringify(canvasState.activeObject, null, 2)}

Predict the next action and confidence (0-1).
Return JSON: { "action": "action_description", "confidence": 0.7 }`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format')
    }

    const jsonMatch = content.text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Next action prediction error:', error)
    return {
      action: 'Continue editing',
      confidence: 0.5
    }
  }
}