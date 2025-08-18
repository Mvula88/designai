import anthropic, { CLAUDE_MODELS } from './client'
import { createClient } from '@/lib/supabase/client'

interface PerformancePrediction {
  engagementScore: number // 0-100
  clickProbability: number // 0-1
  conversionEstimate: number // 0-1
  accessibilityScore: number // 0-100
  readabilityScore: number // 0-100
  suggestions: {
    category: 'layout' | 'color' | 'typography' | 'accessibility' | 'content'
    priority: 'high' | 'medium' | 'low'
    issue: string
    suggestion: string
    impact: string
  }[]
  strengths: string[]
  weaknesses: string[]
}

export async function predictDesignPerformance(
  canvasData: any,
  designType: 'landing' | 'social' | 'banner' | 'general' = 'general'
): Promise<PerformancePrediction> {
  const supabase = createClient()
  
  try {
    const prompt = `Analyze this design's potential performance and provide metrics.

Design data:
${JSON.stringify(canvasData, null, 2).slice(0, 3000)}

Design type: ${designType}

Analyze the design for:
1. Visual engagement potential (how likely to catch attention)
2. Click-through probability (for interactive elements)
3. Conversion potential (likelihood of achieving goal)
4. Accessibility compliance
5. Readability and information hierarchy

Return a JSON response with this exact structure:
{
  "engagementScore": 0-100,
  "clickProbability": 0-1,
  "conversionEstimate": 0-1,
  "accessibilityScore": 0-100,
  "readabilityScore": 0-100,
  "suggestions": [
    {
      "category": "layout|color|typography|accessibility|content",
      "priority": "high|medium|low",
      "issue": "description of issue",
      "suggestion": "how to fix it",
      "impact": "expected improvement"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`

    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 2048,
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

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response')
    }

    const prediction: PerformancePrediction = JSON.parse(jsonMatch[0])

    // Save to database for tracking
    if (canvasData.designId) {
      await supabase.from('design_predictions').insert({
        design_id: canvasData.designId,
        engagement_score: prediction.engagementScore,
        click_probability: prediction.clickProbability,
        conversion_estimate: prediction.conversionEstimate,
        accessibility_score: prediction.accessibilityScore,
        suggestions: prediction.suggestions
      })
    }

    return prediction
  } catch (error) {
    console.error('Performance prediction error:', error)
    
    // Return default prediction on error
    return {
      engagementScore: 50,
      clickProbability: 0.5,
      conversionEstimate: 0.5,
      accessibilityScore: 70,
      readabilityScore: 70,
      suggestions: [
        {
          category: 'general',
          priority: 'medium',
          issue: 'Unable to analyze design',
          suggestion: 'Please try again or check your design data',
          impact: 'Analysis will provide personalized recommendations'
        }
      ],
      strengths: ['Design loaded successfully'],
      weaknesses: ['Analysis incomplete']
    }
  }
}

export async function getDesignInsights(
  canvasData: any,
  userPreferences: any
): Promise<string[]> {
  try {
    const prompt = `Based on this design and user preferences, provide 5 actionable insights.

Design: ${JSON.stringify(canvasData.objects?.slice(0, 5), null, 2)}
User often uses: ${JSON.stringify(userPreferences, null, 2)}

Provide insights as a JSON array of strings.`

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
    if (content.type !== 'text') return []

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Insights generation error:', error)
    return [
      'Consider increasing contrast for better readability',
      'Try using a more consistent color palette',
      'Add more whitespace between elements',
      'Ensure text is large enough for mobile viewing',
      'Consider adding a clear call-to-action'
    ]
  }
}