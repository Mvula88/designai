import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSupabaseSchema } from '@/lib/playground/supabase-provisioner'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      playgroundId,
      integrationId,
      requirements,
    } = await request.json()

    // Get the playground details
    const { data: playground } = await supabase
      .from('playgrounds')
      .select('*')
      .eq('id', playgroundId)
      .single()

    if (!playground) {
      return NextResponse.json({ error: 'Playground not found' }, { status: 404 })
    }

    // Get the Supabase integration
    const { data: integration } = await supabase
      .from('playground_integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (!integration || integration.service_type !== 'supabase') {
      return NextResponse.json({ error: 'Invalid Supabase integration' }, { status: 400 })
    }

    // Analyze the code to determine what Supabase resources are needed
    const codeAnalysis = analyzeCodeForSupabaseNeeds(playground.current_code)
    
    // Generate Supabase schema based on requirements
    const schema = await generateSupabaseSchema({
      requirements: requirements || codeAnalysis.requirements,
      features: codeAnalysis.features,
    })

    // Store the generated resources
    const resources = []
    
    // Create tables
    for (const table of schema.tables) {
      const { data: resource } = await supabase
        .from('playground_supabase_resources')
        .insert({
          playground_id: playgroundId,
          integration_id: integrationId,
          resource_type: 'table',
          resource_name: table.name,
          resource_definition: table.sql,
          applied: false,
        })
        .select()
        .single()
      
      resources.push(resource)
    }

    // Create RLS policies
    for (const policy of schema.policies) {
      const { data: resource } = await supabase
        .from('playground_supabase_resources')
        .insert({
          playground_id: playgroundId,
          integration_id: integrationId,
          resource_type: 'rls_policy',
          resource_name: policy.name,
          resource_definition: policy.sql,
          applied: false,
        })
        .select()
        .single()
      
      resources.push(resource)
    }

    // Create auth configuration
    if (schema.auth) {
      const { data: resource } = await supabase
        .from('playground_supabase_resources')
        .insert({
          playground_id: playgroundId,
          integration_id: integrationId,
          resource_type: 'auth_provider',
          resource_name: 'auth_config',
          resource_definition: JSON.stringify(schema.auth),
          applied: false,
        })
        .select()
        .single()
      
      resources.push(resource)
    }

    // Generate TypeScript types
    const types = generateTypeScriptTypes(schema)
    
    // Update the playground code with Supabase client and types
    const updatedCode = {
      ...playground.current_code,
      'lib/supabase.ts': generateSupabaseClient(integration.config),
      'types/database.ts': types,
    }

    await supabase
      .from('playgrounds')
      .update({
        current_code: updatedCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playgroundId)

    return NextResponse.json({
      success: true,
      resources,
      schema,
      types,
    })
  } catch (error) {
    console.error('Supabase provisioning error:', error)
    return NextResponse.json(
      { error: 'Failed to provision Supabase resources' },
      { status: 500 }
    )
  }
}

function analyzeCodeForSupabaseNeeds(code: Record<string, string>) {
  const features = {
    hasAuth: false,
    hasDatabase: false,
    hasStorage: false,
    hasRealtime: false,
  }
  
  const requirements = []
  
  // Analyze code for Supabase usage patterns
  const codeString = JSON.stringify(code)
  
  // Check for auth usage
  if (codeString.includes('signIn') || codeString.includes('signUp') || codeString.includes('auth')) {
    features.hasAuth = true
    requirements.push('User authentication with email/password')
  }
  
  // Check for database usage
  if (codeString.includes('from(') || codeString.includes('select') || codeString.includes('insert')) {
    features.hasDatabase = true
  }
  
  // Check for storage usage
  if (codeString.includes('storage') || codeString.includes('upload') || codeString.includes('download')) {
    features.hasStorage = true
    requirements.push('File storage for uploads')
  }
  
  // Check for realtime usage
  if (codeString.includes('subscribe') || codeString.includes('realtime') || codeString.includes('on(')) {
    features.hasRealtime = true
    requirements.push('Real-time data synchronization')
  }
  
  // Infer data models from component names and usage
  if (codeString.includes('Task') || codeString.includes('Todo')) {
    requirements.push('Task management with CRUD operations')
  }
  
  if (codeString.includes('User') || codeString.includes('Profile')) {
    requirements.push('User profiles with metadata')
  }
  
  if (codeString.includes('Team') || codeString.includes('Organization')) {
    requirements.push('Team collaboration features')
  }
  
  if (codeString.includes('Comment') || codeString.includes('Message')) {
    requirements.push('Comments or messaging system')
  }
  
  return {
    features,
    requirements,
  }
}

function generateTypeScriptTypes(schema: any): string {
  let types = `// Generated TypeScript types for Supabase\n\n`
  
  types += `export type Database = {\n`
  types += `  public: {\n`
  types += `    Tables: {\n`
  
  for (const table of schema.tables) {
    types += `      ${table.name}: {\n`
    types += `        Row: {\n`
    
    for (const column of table.columns) {
      types += `          ${column.name}: ${getTypeScriptType(column.type)}${column.nullable ? ' | null' : ''}\n`
    }
    
    types += `        }\n`
    types += `        Insert: {\n`
    
    for (const column of table.columns) {
      const isOptional = column.default || column.nullable || column.name === 'id'
      types += `          ${column.name}${isOptional ? '?' : ''}: ${getTypeScriptType(column.type)}${column.nullable ? ' | null' : ''}\n`
    }
    
    types += `        }\n`
    types += `        Update: {\n`
    
    for (const column of table.columns) {
      types += `          ${column.name}?: ${getTypeScriptType(column.type)}${column.nullable ? ' | null' : ''}\n`
    }
    
    types += `        }\n`
    types += `      }\n`
  }
  
  types += `    }\n`
  types += `  }\n`
  types += `}\n`
  
  return types
}

function getTypeScriptType(sqlType: string): string {
  const typeMap: Record<string, string> = {
    'uuid': 'string',
    'text': 'string',
    'varchar': 'string',
    'integer': 'number',
    'bigint': 'number',
    'boolean': 'boolean',
    'timestamp': 'string',
    'timestamptz': 'string',
    'jsonb': 'any',
    'json': 'any',
  }
  
  return typeMap[sqlType.toLowerCase()] || 'any'
}

function generateSupabaseClient(config: any): string {
  return `import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '${config.project_url}'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '${config.anon_key}'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
`
}