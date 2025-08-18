import anthropic, { CLAUDE_MODELS } from './client'
import { createClient } from '@/lib/supabase/client'

interface VisionAnalysisResult {
  description: string
  elements: Array<{
    type: string
    properties: any
    position: { x: number; y: number }
    dimensions?: { width: number; height: number }
  }>
  colors: string[]
  typography: {
    fonts: string[]
    sizes: number[]
  }
  suggestions: string[]
  fabricObjects?: any[]
}

export async function analyzeImageWithClaude(
  imageUrl: string,
  analysisType: 'design_archaeology' | 'style_extraction' | 'element_detection' = 'design_archaeology'
): Promise<VisionAnalysisResult> {
  const supabase = createClient()
  
  // Check cache first
  const { data: cached } = await supabase
    .from('claude_analysis')
    .select('*')
    .eq('image_url', imageUrl)
    .eq('analysis_type', analysisType)
    .single()

  if (cached) {
    return cached.claude_response as VisionAnalysisResult
  }

  try {
    // Fetch image as base64
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const base64 = await blobToBase64(blob)

    // Prepare the prompt based on analysis type
    const prompts = {
      design_archaeology: `Analyze this design image and provide:
1. A detailed description of the design
2. Identify all visual elements (text, shapes, images, etc.)
3. Extract color palette
4. Identify typography (fonts and sizes)
5. Provide design improvement suggestions
6. Convert elements to Fabric.js compatible objects

Return as JSON with this structure:
{
  "description": "overall design description",
  "elements": [
    {
      "type": "text|rectangle|circle|image",
      "properties": { /* fabric.js properties */ },
      "position": { "x": 0, "y": 0 },
      "dimensions": { "width": 100, "height": 50 }
    }
  ],
  "colors": ["#hex1", "#hex2"],
  "typography": {
    "fonts": ["font1", "font2"],
    "sizes": [16, 24, 32]
  },
  "suggestions": ["suggestion1", "suggestion2"],
  "fabricObjects": [/* fabric.js object definitions */]
}`,
      style_extraction: `Extract the design style and patterns from this image.`,
      element_detection: `Detect and list all visual elements in this image.`
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODELS.VISION,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64.split(',')[1]
              }
            },
            {
              type: 'text',
              text: prompts[analysisType]
            }
          ]
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response format')
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response')
    }

    const result: VisionAnalysisResult = JSON.parse(jsonMatch[0])

    // Convert to Fabric.js objects
    if (result.elements && !result.fabricObjects) {
      result.fabricObjects = convertToFabricObjects(result.elements)
    }

    // Cache the result
    await supabase.from('claude_analysis').insert({
      image_url: imageUrl,
      analysis_type: analysisType,
      claude_response: result,
      fabric_objects: result.fabricObjects,
      model_used: CLAUDE_MODELS.VISION,
      tokens_used: message.usage?.input_tokens || 0
    })

    return result
  } catch (error) {
    console.error('Vision analysis error:', error)
    throw error
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function convertToFabricObjects(elements: any[]): any[] {
  return elements.map(element => {
    const baseProps = {
      left: element.position.x,
      top: element.position.y,
      ...element.properties
    }

    switch (element.type) {
      case 'text':
        return {
          type: 'i-text',
          text: element.properties.text || 'Text',
          fontSize: element.properties.fontSize || 16,
          fontFamily: element.properties.fontFamily || 'Arial',
          fill: element.properties.fill || '#000000',
          ...baseProps
        }
      
      case 'rectangle':
        return {
          type: 'rect',
          width: element.dimensions?.width || 100,
          height: element.dimensions?.height || 100,
          fill: element.properties.fill || '#cccccc',
          stroke: element.properties.stroke,
          strokeWidth: element.properties.strokeWidth || 0,
          ...baseProps
        }
      
      case 'circle':
        return {
          type: 'circle',
          radius: element.dimensions?.width ? element.dimensions.width / 2 : 50,
          fill: element.properties.fill || '#cccccc',
          stroke: element.properties.stroke,
          strokeWidth: element.properties.strokeWidth || 0,
          ...baseProps
        }
      
      case 'image':
        return {
          type: 'image',
          src: element.properties.src,
          width: element.dimensions?.width || 200,
          height: element.dimensions?.height || 200,
          ...baseProps
        }
      
      default:
        return {
          type: 'rect',
          ...baseProps
        }
    }
  })
}