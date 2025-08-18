import anthropic, { CLAUDE_MODELS } from './client'

interface DesignCommand {
  action: string
  description: string
  fabricCommands?: Array<{
    method: string
    args?: any[]
  }>
  cssChanges?: Record<string, any>
  suggestions?: string[]
}

export async function interpretDesignCommand(
  userInput: string,
  canvasState: any,
  userPreferences: any
): Promise<DesignCommand> {
  try {
    const prompt = `You are a design assistant that interprets natural language commands and converts them to Fabric.js operations.

Current canvas state:
${JSON.stringify(canvasState, null, 2).slice(0, 1000)}

User command: "${userInput}"

Interpret this command and return a JSON response with:
1. action: A brief description of what you're doing
2. description: A detailed explanation
3. fabricCommands: Array of Fabric.js method calls to execute
4. suggestions: Additional improvements the user might want

Example commands you should understand:
- "make it pop" -> increase contrast, add shadows, brighten colors
- "more professional" -> use corporate colors, clean fonts, proper alignment
- "add whitespace" -> increase padding and margins
- "make the text bigger" -> increase fontSize
- "change background to blue" -> set canvas background
- "align everything to center" -> center all objects

Return ONLY valid JSON in this format:
{
  "action": "brief action",
  "description": "detailed description",
  "fabricCommands": [
    {
      "method": "set",
      "args": [{ "fill": "#color" }]
    }
  ],
  "suggestions": ["suggestion1", "suggestion2"]
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

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Command interpretation error:', error)
    
    // Return a fallback command
    return {
      action: 'Unable to process command',
      description: 'Sorry, I couldn\'t understand that command. Please try rephrasing it.',
      suggestions: [
        'Try being more specific about what you want to change',
        'Use simple commands like "make text bigger" or "change color to blue"'
      ]
    }
  }
}

export async function generateDesignSuggestions(
  canvasState: any,
  recentActions: any[],
  userPreferences: any
): Promise<string[]> {
  try {
    const prompt = `Based on the current design and user's recent actions, suggest 3-5 specific improvements.

Current design elements: ${JSON.stringify(canvasState.objects?.slice(0, 5), null, 2)}
Recent actions: ${JSON.stringify(recentActions.slice(0, 5), null, 2)}

Provide practical, actionable suggestions that would improve the design.
Return as a JSON array of strings.`

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
      return []
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Suggestion generation error:', error)
    return [
      'Try adjusting the color contrast for better readability',
      'Consider adding more whitespace between elements',
      'Align similar elements for a cleaner look'
    ]
  }
}