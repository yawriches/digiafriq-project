-- Fix course_lessons table - Add missing columns
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS instructor_notes TEXT;

-- Fix courses table - Add instructor column (text) alongside instructor_id
-- This allows the admin panel to work while maintaining the UUID reference
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing courses to have status if null
UPDATE courses SET status = 'draft' WHERE status IS NULL;

-- Add comment
COMMENT ON COLUMN course_lessons.video_url IS 'Direct video URL (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN course_lessons.instructor_notes IS 'Instructor notes for students';
COMMENT ON COLUMN courses.instructor IS 'Instructor name (text) - used by admin panel';
COMMENT ON COLUMN courses.instructor_id IS 'Instructor user ID (UUID) - for user reference';
