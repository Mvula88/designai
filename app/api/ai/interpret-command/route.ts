import { NextResponse } from 'next/server'
import anthropic, { CLAUDE_MODELS } from '@/lib/anthropic/client'

export async function POST(request: Request) {
  try {
    const { userInput, canvasState, userPreferences } = await request.json()

    const prompt = `You are a design assistant that interprets natural language commands and converts them to Fabric.js operations.

Current canvas state:
${JSON.stringify(canvasState, null, 2).slice(0, 1000)}

User command: "${userInput}"

Interpret this command and return a JSON response with:
1. action: A brief description of what you're doing
2. description: A detailed explanation
3. fabricCommands: Array of Fabric.js method calls to execute

Example fabric commands:
- {"method": "setBackgroundColor", "args": ["#ff0000"]}
- {"method": "add", "args": [{"type": "rect", "left": 100, "top": 100, "width": 200, "height": 100, "fill": "#00ff00"}]}
- {"method": "setFill", "args": ["#0000ff"]} (for selected objects)
- {"method": "set", "args": [{"fontSize": 24}]} (for text objects)

Return ONLY valid JSON, no markdown or explanation.`

    const response = await anthropic.messages.create({
      model: CLAUDE_MODELS.FAST,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      try {
        const command = JSON.parse(content.text)
        return NextResponse.json(command)
      } catch {
        // If JSON parsing fails, return a default command
        return NextResponse.json({
          action: 'interpretation',
          description: content.text,
          suggestions: ['Try rephrasing your command'],
        })
      }
    }

    return NextResponse.json({
      action: 'error',
      description: 'Could not interpret the command',
      suggestions: ['Try a simpler command'],
    })
  } catch (error) {
    console.error('Error interpreting command:', error)
    return NextResponse.json(
      { error: 'Failed to interpret command' },
      { status: 500 }
    )
  }
}