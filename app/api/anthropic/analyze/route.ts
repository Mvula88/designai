import { NextRequest, NextResponse } from 'next/server'
import { analyzeImageWithClaude } from '@/lib/anthropic/vision'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, analysisType } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    const result = await analyzeImageWithClaude(
      imageUrl,
      analysisType || 'design_archaeology'
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
