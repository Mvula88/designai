-- Create design_pages table for multi-page support
CREATE TABLE IF NOT EXISTS design_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Page',
  type VARCHAR(50) NOT NULL DEFAULT 'page',
  icon VARCHAR(50) NOT NULL DEFAULT 'FileText',
  canvas_data JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_design_pages_design_id ON design_pages(design_id);
CREATE INDEX IF NOT EXISTS idx_design_pages_order ON design_pages(design_id, order_index);

-- Enable RLS (Row Level Security)
ALTER TABLE design_pages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their design pages
CREATE POLICY "Users can manage their design pages" ON design_pages
FOR ALL
USING (
  design_id IN (
    SELECT id FROM designs WHERE user_id = auth.uid()
  )
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_design_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_design_pages_updated_at
  BEFORE UPDATE ON design_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_design_pages_updated_at();