import { NextRequest, NextResponse } from 'next/server'
import { interpretDesignCommand } from '@/lib/anthropic/commands'

export async function POST(request: NextRequest) {
  try {
    const { userInput, canvasState, userPreferences } = await request.json()

    if (!userInput) {
      return NextResponse.json(
        { error: 'User input is required' },
        { status: 400 }
      )
    }

    const command = await interpretDesignCommand(
      userInput,
      canvasState,
      userPreferences
    )

    return NextResponse.json(command)
  } catch (error) {
    console.error('Command interpretation error:', error)
    return NextResponse.json(
      { error: 'Failed to interpret command' },
      { status: 500 }
    )
  }
}
