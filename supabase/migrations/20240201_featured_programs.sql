-- Featured Programs Table
-- Allows admins to create multiple featured programs like AI Cashflow Program

CREATE TABLE IF NOT EXISTS featured_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'brain', -- lucide icon name
  gradient_from VARCHAR(20) DEFAULT '#ed874a',
  gradient_to VARCHAR(20) DEFAULT '#d76f32',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program Divisions Table (e.g., Skills, Monetization)
CREATE TABLE IF NOT EXISTS program_divisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES featured_programs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'book-open',
  color VARCHAR(20) DEFAULT '#3b82f6',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, slug)
);

-- Link courses to program divisions
CREATE TABLE IF NOT EXISTS program_division_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID NOT NULL REFERENCES program_divisions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(division_id, course_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_featured_programs_active ON featured_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_programs_order ON featured_programs(display_order);
CREATE INDEX IF NOT EXISTS idx_program_divisions_program ON program_divisions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_division_courses_division ON program_division_courses(division_id);
CREATE INDEX IF NOT EXISTS idx_program_division_courses_course ON program_division_courses(course_id);

-- Insert the AI Cashflow Program as the first featured program
INSERT INTO featured_programs (title, description, slug, icon, gradient_from, gradient_to, is_active, display_order)
VALUES (
  'AI Cashflow Program',
  'Master AI skills and monetize them effectively. Learn cutting-edge AI technologies and turn your knowledge into income.',
  'ai-cashflow-program',
  'brain',
  '#ed874a',
  '#d76f32',
  true,
  1
) ON CONFLICT (slug) DO NOTHING;

-- Get the AI Cashflow Program ID and create its divisions
DO $$
DECLARE
  program_id UUID;
BEGIN
  SELECT id INTO program_id FROM featured_programs WHERE slug = 'ai-cashflow-program';
  
  IF program_id IS NOT NULL THEN
    -- Insert Skills Division
    INSERT INTO program_divisions (program_id, title, description, slug, icon, color, display_order)
    VALUES (
      program_id,
      'AI Skills Development',
      'Master the technical foundations of artificial intelligence',
      'skills',
      'brain',
      '#3b82f6',
      1
    ) ON CONFLICT (program_id, slug) DO NOTHING;
    
    -- Insert Monetization Division
    INSERT INTO program_divisions (program_id, title, description, slug, icon, color, display_order)
    VALUES (
      program_id,
      'AI Monetization',
      'Learn to monetize your AI skills through various channels',
      'monetization',
      'dollar-sign',
      '#22c55e',
      2
    ) ON CONFLICT (program_id, slug) DO NOTHING;
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_featured_programs_updated_at ON featured_programs;
CREATE TRIGGER update_featured_programs_updated_at
  BEFORE UPDATE ON featured_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_divisions_updated_at ON program_divisions;
CREATE TRIGGER update_program_divisions_updated_at
  BEFORE UPDATE ON program_divisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
