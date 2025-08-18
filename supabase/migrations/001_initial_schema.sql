-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users profile
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Designs table with canvas data
CREATE TABLE public.designs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  canvas_data JSONB NOT NULL DEFAULT '{"objects":[],"background":"#ffffff"}',
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  dimensions JSONB DEFAULT '{"width": 800, "height": 600}',
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Design versions for history
CREATE TABLE public.design_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  canvas_data JSONB NOT NULL,
  thumbnail_url TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User canvas actions for AI learning
CREATE TABLE public.canvas_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  object_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Claude AI analysis cache
CREATE TABLE public.claude_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  claude_response JSONB NOT NULL,
  fabric_objects JSONB,
  model_used TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(image_url, analysis_type)
);

-- User preferences learned by Claude
CREATE TABLE public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_data JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  usage_count INTEGER DEFAULT 1,
  embedding vector(1536),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Design performance predictions
CREATE TABLE public.design_predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE,
  engagement_score FLOAT,
  click_probability FLOAT,
  conversion_estimate FLOAT,
  accessibility_score FLOAT,
  suggestions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Collaboration sessions
CREATE TABLE public.collaboration_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  design_id UUID REFERENCES public.designs(id) ON DELETE CASCADE,
  active_users JSONB DEFAULT '[]',
  cursor_positions JSONB DEFAULT '{}',
  selected_objects JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Assets library
CREATE TABLE public.assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  dimensions JSONB,
  metadata JSONB,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_designs_user_id ON public.designs(user_id);
CREATE INDEX idx_canvas_actions_user_id ON public.canvas_actions(user_id);
CREATE INDEX idx_canvas_actions_design_id ON public.canvas_actions(design_id);
CREATE INDEX idx_user_preferences_embedding ON public.user_preferences 
  USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own designs" ON public.designs
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own designs" ON public.designs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs" ON public.designs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own designs" ON public.designs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own canvas actions" ON public.canvas_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own canvas actions" ON public.canvas_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assets" ON public.assets
  FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON public.collaboration_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();