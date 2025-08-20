import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTemplates } from '@/lib/templates/get-templates'

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json()
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const templates = getTemplates()
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create a new playground with the template
    const { data, error } = await supabase
      .from('playgrounds')
      .insert({
        user_id: user.id,
        name: `${template.name} - Copy`,
        description: template.description,
        framework: template.framework,
        language: template.language,
        styling: template.styling,
        current_code: template.code,
        prompt_history: [],
        settings: {
          template_id: template.id,
          template_name: template.name,
          imported_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create playground:', error)
      return NextResponse.json(
        { error: 'Failed to import template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      playgroundId: data.id,
      message: 'Template imported successfully'
    })
  } catch (error) {
    console.error('Template import error:', error)
    return NextResponse.json(
      { error: 'Failed to import template' },
      { status: 500 }
    )
  }
}