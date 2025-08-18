import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ProvisioningOptions {
  requirements: string[]
  features: {
    hasAuth: boolean
    hasDatabase: boolean
    hasStorage: boolean
    hasRealtime: boolean
  }
}

export async function generateSupabaseSchema(options: ProvisioningOptions) {
  const { requirements, features } = options

  // Build a prompt for Claude to generate the schema
  const prompt = `Based on these requirements, generate a complete Supabase database schema:

Requirements:
${requirements.map((r) => `- ${r}`).join('\n')}

Features needed:
- Authentication: ${features.hasAuth}
- Database: ${features.hasDatabase}
- Storage: ${features.hasStorage}
- Realtime: ${features.hasRealtime}

Generate:
1. SQL table definitions with appropriate columns and types
2. RLS (Row Level Security) policies for each table
3. Indexes for performance
4. Auth configuration if needed
5. Storage buckets if needed

Return the result as a JSON object with this structure:
{
  "tables": [
    {
      "name": "table_name",
      "sql": "CREATE TABLE ...",
      "columns": [
        {"name": "id", "type": "uuid", "nullable": false, "default": "uuid_generate_v4()"}
      ]
    }
  ],
  "policies": [
    {
      "name": "policy_name",
      "table": "table_name",
      "sql": "CREATE POLICY ..."
    }
  ],
  "indexes": [
    {
      "name": "index_name",
      "sql": "CREATE INDEX ..."
    }
  ],
  "auth": {
    "providers": ["email", "google"],
    "settings": {}
  },
  "storage": {
    "buckets": ["avatars", "uploads"]
  }
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.5,
      system:
        'You are a Supabase expert. Generate optimal database schemas with proper security and performance considerations.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Parse the response
    const content = response.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      return JSON.parse(content.text)
    }
  } catch (error) {
    console.error('Failed to generate schema:', error)

    // Return a default schema as fallback
    return generateDefaultSchema(requirements)
  }
}

function generateDefaultSchema(requirements: string[]) {
  const schema: any = {
    tables: [],
    policies: [],
    indexes: [],
    auth: {
      providers: ['email'],
      settings: {},
    },
  }

  // Always include a profiles table
  schema.tables.push({
    name: 'profiles',
    sql: `CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      username TEXT UNIQUE,
      full_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    )`,
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'username', type: 'text', nullable: true },
      { name: 'full_name', type: 'text', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      {
        name: 'created_at',
        type: 'timestamptz',
        nullable: false,
        default: 'NOW()',
      },
      {
        name: 'updated_at',
        type: 'timestamptz',
        nullable: false,
        default: 'NOW()',
      },
    ],
  })

  // Add RLS policies for profiles
  schema.policies.push({
    name: 'Users can view own profile',
    table: 'profiles',
    sql: `CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id)`,
  })

  schema.policies.push({
    name: 'Users can update own profile',
    table: 'profiles',
    sql: `CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id)`,
  })

  // Check for specific requirements and add relevant tables
  const reqString = requirements.join(' ').toLowerCase()

  if (reqString.includes('task') || reqString.includes('todo')) {
    schema.tables.push({
      name: 'tasks',
      sql: `CREATE TABLE public.tasks (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )`,
      columns: [
        {
          name: 'id',
          type: 'uuid',
          nullable: false,
          default: 'uuid_generate_v4()',
        },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'pending' },
        { name: 'priority', type: 'text', nullable: false, default: 'medium' },
        { name: 'due_date', type: 'timestamptz', nullable: true },
        {
          name: 'created_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
      ],
    })

    schema.policies.push({
      name: 'Users can manage own tasks',
      table: 'tasks',
      sql: `CREATE POLICY "Users can manage own tasks" ON public.tasks
        FOR ALL USING (auth.uid() = user_id)`,
    })

    schema.indexes.push({
      name: 'idx_tasks_user_id',
      sql: 'CREATE INDEX idx_tasks_user_id ON public.tasks(user_id)',
    })
  }

  if (reqString.includes('team') || reqString.includes('collaboration')) {
    schema.tables.push({
      name: 'teams',
      sql: `CREATE TABLE public.teams (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )`,
      columns: [
        {
          name: 'id',
          type: 'uuid',
          nullable: false,
          default: 'uuid_generate_v4()',
        },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'owner_id', type: 'uuid', nullable: false },
        {
          name: 'created_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
      ],
    })

    schema.tables.push({
      name: 'team_members',
      sql: `CREATE TABLE public.team_members (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        UNIQUE(team_id, user_id)
      )`,
      columns: [
        {
          name: 'id',
          type: 'uuid',
          nullable: false,
          default: 'uuid_generate_v4()',
        },
        { name: 'team_id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'role', type: 'text', nullable: false, default: 'member' },
        {
          name: 'joined_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
      ],
    })

    schema.policies.push({
      name: 'Team members can view team',
      table: 'teams',
      sql: `CREATE POLICY "Team members can view team" ON public.teams
        FOR SELECT USING (
          auth.uid() = owner_id OR
          EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = teams.id
            AND team_members.user_id = auth.uid()
          )
        )`,
    })
  }

  if (reqString.includes('comment') || reqString.includes('message')) {
    schema.tables.push({
      name: 'comments',
      sql: `CREATE TABLE public.comments (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id UUID,
        parent_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
      )`,
      columns: [
        {
          name: 'id',
          type: 'uuid',
          nullable: false,
          default: 'uuid_generate_v4()',
        },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'content', type: 'text', nullable: false },
        { name: 'parent_id', type: 'uuid', nullable: true },
        { name: 'parent_type', type: 'text', nullable: true },
        {
          name: 'created_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          nullable: false,
          default: 'NOW()',
        },
      ],
    })

    schema.policies.push({
      name: 'Users can view comments',
      table: 'comments',
      sql: `CREATE POLICY "Users can view comments" ON public.comments
        FOR SELECT USING (true)`,
    })

    schema.policies.push({
      name: 'Users can create comments',
      table: 'comments',
      sql: `CREATE POLICY "Users can create comments" ON public.comments
        FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    })
  }

  return schema
}
