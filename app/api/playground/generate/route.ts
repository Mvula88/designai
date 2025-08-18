import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      prompt,
      playgroundId,
      currentCode,
      framework,
      language,
      styling,
    } = await request.json()

    // Build the system prompt based on the project settings
    const systemPrompt = `You are an expert full-stack developer. You are building a ${framework} application using ${language} with ${styling} for styling.

Your task is to generate complete, production-ready code based on the user's requirements. 

Important guidelines:
1. Generate complete, working code files
2. Include all necessary imports and dependencies
3. Use TypeScript for type safety
4. Include proper error handling
5. Follow best practices for ${framework}
6. Use ${styling} for all styling
7. Make the UI responsive and accessible
8. Include comments to explain complex logic

When generating code, return a JSON object with the following structure:
{
  "code": {
    "filename1.tsx": "file content",
    "filename2.ts": "file content",
    ...
  },
  "explanation": "Brief explanation of what was generated",
  "files": ["list", "of", "modified", "files"],
  "dependencies": ["list", "of", "npm", "packages", "to", "install"]
}

Current project files:
${JSON.stringify(currentCode, null, 2)}
`

    const userPrompt = `User request: ${prompt}

Please generate or modify the code according to this request. Make sure the code is complete and ready to run.`

    // Generate code using Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Parse the response
    let generatedCode
    try {
      const content = response.content[0]
      if (content.type === 'text') {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          generatedCode = JSON.parse(jsonMatch[1])
        } else {
          // Try to parse the entire response as JSON
          generatedCode = JSON.parse(content.text)
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      
      // Fallback: create a simple response
      generatedCode = {
        code: currentCode,
        explanation: "I've analyzed your request. Please be more specific about what you'd like to build.",
        files: Object.keys(currentCode),
        dependencies: [],
      }
    }

    // Merge with existing code
    const updatedCode = {
      ...currentCode,
      ...generatedCode.code,
    }

    // Save generation to database
    await supabase.from('playground_generations').insert({
      playground_id: playgroundId,
      user_id: user.id,
      prompt,
      response: generatedCode,
      model_used: 'claude-3-sonnet',
      tokens_used: response.usage?.input_tokens + response.usage?.output_tokens,
    })

    // Update playground with new code
    await supabase
      .from('playgrounds')
      .update({
        current_code: updatedCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playgroundId)

    // Save individual files
    for (const [filePath, content] of Object.entries(generatedCode.code)) {
      await supabase
        .from('playground_files')
        .upsert({
          playground_id: playgroundId,
          file_path: filePath,
          content: content as string,
          file_type: filePath.split('.').pop(),
          size: (content as string).length,
        })
    }

    return NextResponse.json({
      code: updatedCode,
      explanation: generatedCode.explanation,
      files: generatedCode.files,
      dependencies: generatedCode.dependencies,
    })
  } catch (error) {
    console.error('Code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}