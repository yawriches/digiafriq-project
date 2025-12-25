-- Create tutorials table (similar to courses but for affiliates)
-- Drop existing tutorials table if it exists and recreate with new structure
DROP TABLE IF EXISTS tutorial_lessons CASCADE;
DROP TABLE IF EXISTS tutorial_modules CASCADE;
DROP TABLE IF EXISTS tutorials CASCADE;

-- Tutorials table (main table)
CREATE TABLE tutorials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor TEXT,
    duration TEXT,
    level TEXT DEFAULT 'Beginner',
    category TEXT DEFAULT 'getting-started',
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutorial modules table
CREATE TABLE tutorial_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tutorial_id UUID REFERENCES tutorials(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tutorial lessons table
CREATE TABLE tutorial_lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_id UUID REFERENCES tutorial_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'video',
    content_url TEXT,
    video_url TEXT,
    instructor_notes TEXT,
    duration TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorials
-- Anyone can view published tutorials
CREATE POLICY "Anyone can view published tutorials" 
ON tutorials FOR SELECT 
USING (is_published = true);

-- Admins can view all tutorials
CREATE POLICY "Admins can view all tutorials" 
ON tutorials FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Admins can insert tutorials
CREATE POLICY "Admins can insert tutorials" 
ON tutorials FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Admins can update tutorials
CREATE POLICY "Admins can update tutorials" 
ON tutorials FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Admins can delete tutorials
CREATE POLICY "Admins can delete tutorials" 
ON tutorials FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- RLS Policies for tutorial_modules
CREATE POLICY "Anyone can view tutorial modules" 
ON tutorial_modules FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert tutorial modules" 
ON tutorial_modules FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can update tutorial modules" 
ON tutorial_modules FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can delete tutorial modules" 
ON tutorial_modules FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- RLS Policies for tutorial_lessons
CREATE POLICY "Anyone can view tutorial lessons" 
ON tutorial_lessons FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert tutorial lessons" 
ON tutorial_lessons FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can update tutorial lessons" 
ON tutorial_lessons FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

CREATE POLICY "Admins can delete tutorial lessons" 
ON tutorial_lessons FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.active_role = 'admin' OR profiles.role = 'admin')
  )
);

-- Create indexes
CREATE INDEX idx_tutorials_is_published ON tutorials(is_published);
CREATE INDEX idx_tutorials_is_featured ON tutorials(is_featured);
CREATE INDEX idx_tutorials_category ON tutorials(category);
CREATE INDEX idx_tutorial_modules_tutorial_id ON tutorial_modules(tutorial_id);
CREATE INDEX idx_tutorial_lessons_module_id ON tutorial_lessons(module_id);
