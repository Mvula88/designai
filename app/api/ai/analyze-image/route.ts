import { NextResponse } from 'next/server'
import anthropic, { CLAUDE_MODELS } from '@/lib/anthropic/client'

export async function POST(request: Request) {
  try {
    const { imageUrl, analysisType = 'design_archaeology' } = await request.json()

    const prompts = {
      design_archaeology: `Analyze this image and extract all design elements for reconstruction in a canvas editor.
        Return a JSON response with:
        1. description: Brief description of the design
        2. elements: Array of detected UI elements with their type, properties, position, and dimensions
        3. colors: Array of hex color codes used
        4. typography: Object with fonts and sizes arrays
        5. suggestions: Array of design improvement suggestions
        6. fabricObjects: Array of Fabric.js objects that can recreate this design
        
        For fabricObjects, use standard Fabric.js object format like:
        {"type": "rect", "left": 100, "top": 100, "width": 200, "height": 100, "fill": "#ff0000"}
        {"type": "text", "left": 50, "top": 50, "text": "Hello", "fontSize": 24, "fill": "#000000"}
        
        Return ONLY valid JSON, no markdown.`,
      style_extraction: `Extract the visual style, color palette, and design patterns from this image.`,
      element_detection: `Detect and categorize all UI elements in this image.`,
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODELS.VISION,
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageUrl.split(',')[1] || imageUrl,
              },
            },
            {
              type: 'text',
              text: prompts[analysisType as keyof typeof prompts],
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      try {
        const result = JSON.parse(content.text)
        return NextResponse.json(result)
      } catch {
        // If JSON parsing fails, return structured response
        return NextResponse.json({
          description: content.text,
          elements: [],
          colors: [],
          typography: { fonts: [], sizes: [] },
          suggestions: ['Could not parse full analysis'],
          fabricObjects: [],
        })
      }
    }

    return NextResponse.json({
      description: 'Analysis failed',
      elements: [],
      colors: [],
      typography: { fonts: [], sizes: [] },
      suggestions: [],
      fabricObjects: [],
    })
  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}