-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Playgrounds table
CREATE TABLE public.playgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt_history JSONB DEFAULT '[]',
  current_code JSONB DEFAULT '{}',
  framework TEXT DEFAULT 'nextjs',
  language TEXT DEFAULT 'typescript',
  styling TEXT DEFAULT 'tailwind',
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  fork_from UUID REFERENCES public.playgrounds(id),
  stars_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Connected services
CREATE TABLE public.playground_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('supabase', 'github', 'vercel', 'netlify')),
  credentials TEXT, -- Encrypted with pgcrypto
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(playground_id, service_type)
);

-- Deployment history
CREATE TABLE public.playground_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('github', 'vercel', 'netlify')),
  deployment_url TEXT,
  preview_url TEXT,
  commit_hash TEXT,
  branch TEXT DEFAULT 'main',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'ready', 'error', 'cancelled')),
  build_logs TEXT,
  environment_variables JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Generated Supabase resources tracking
CREATE TABLE public.playground_supabase_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.playground_integrations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('table', 'rls_policy', 'edge_function', 'storage_bucket', 'auth_provider')),
  resource_name TEXT NOT NULL,
  resource_definition TEXT NOT NULL,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  rollback_definition TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Playground files for multi-file projects
CREATE TABLE public.playground_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(playground_id, file_path)
);

-- AI generation history
CREATE TABLE public.playground_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playground_id UUID REFERENCES public.playgrounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  response JSONB NOT NULL,
  model_used TEXT DEFAULT 'claude-3-sonnet',
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Playground templates
CREATE TABLE public.playground_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  framework TEXT,
  thumbnail_url TEXT,
  starter_code JSONB NOT NULL,
  starter_prompt TEXT,
  tags TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User service tokens (encrypted)
CREATE TABLE public.user_service_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, service_type)
);

-- Create indexes
CREATE INDEX idx_playgrounds_user_id ON public.playgrounds(user_id);
CREATE INDEX idx_playgrounds_public ON public.playgrounds(is_public) WHERE is_public = true;
CREATE INDEX idx_playground_integrations_playground ON public.playground_integrations(playground_id);
CREATE INDEX idx_playground_deployments_playground ON public.playground_deployments(playground_id);
CREATE INDEX idx_playground_deployments_status ON public.playground_deployments(status);
CREATE INDEX idx_playground_files_playground ON public.playground_files(playground_id);
CREATE INDEX idx_playground_generations_playground ON public.playground_generations(playground_id);
CREATE INDEX idx_playground_templates_category ON public.playground_templates(category);

-- Enable RLS
ALTER TABLE public.playgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_supabase_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_service_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playgrounds
CREATE POLICY "Users can view own playgrounds" ON public.playgrounds
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own playgrounds" ON public.playgrounds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playgrounds" ON public.playgrounds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playgrounds" ON public.playgrounds
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for integrations
CREATE POLICY "Users can view own integrations" ON public.playground_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own integrations" ON public.playground_integrations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for deployments
CREATE POLICY "Users can view own deployments" ON public.playground_deployments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deployments" ON public.playground_deployments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for files
CREATE POLICY "Users can view files" ON public.playground_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playgrounds 
      WHERE id = playground_files.playground_id 
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can manage own files" ON public.playground_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.playgrounds 
      WHERE id = playground_files.playground_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for generations
CREATE POLICY "Users can view own generations" ON public.playground_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON public.playground_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for templates
CREATE POLICY "Anyone can view templates" ON public.playground_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can create templates" ON public.playground_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RLS Policies for service tokens
CREATE POLICY "Users can manage own tokens" ON public.user_service_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_playground_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_playgrounds_updated_at BEFORE UPDATE ON public.playgrounds
  FOR EACH ROW EXECUTE FUNCTION public.handle_playground_updated_at();

CREATE TRIGGER update_playground_integrations_updated_at BEFORE UPDATE ON public.playground_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_playground_updated_at();

CREATE TRIGGER update_playground_files_updated_at BEFORE UPDATE ON public.playground_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_playground_updated_at();

CREATE TRIGGER update_user_service_tokens_updated_at BEFORE UPDATE ON public.user_service_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_playground_updated_at();

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_text(plain_text TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(plain_text, key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_text(encrypted_text TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_text, 'base64'), key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;