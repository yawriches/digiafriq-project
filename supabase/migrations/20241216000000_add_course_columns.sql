-- Add missing columns to courses table
-- These columns are used by the admin course management UI

-- Add duration column (text format like "8 weeks", "40 hours")
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration TEXT;

-- Add instructor column (text name, separate from instructor_id)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT;

-- Add level column (Beginner, Intermediate, Advanced)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
