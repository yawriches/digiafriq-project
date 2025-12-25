-- Add performance indexes for courses table
-- These indexes will significantly speed up queries

-- Index for published courses (most common query)
CREATE INDEX IF NOT EXISTS idx_courses_is_published 
ON courses(is_published) 
WHERE is_published = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_courses_category 
ON courses(category);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_courses_created_at 
ON courses(created_at DESC);

-- Composite index for published courses ordered by creation date
CREATE INDEX IF NOT EXISTS idx_courses_published_created 
ON courses(is_published, created_at DESC) 
WHERE is_published = true;

-- Index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_courses_tags 
ON courses USING GIN(tags);

-- Index for enrollments lookup
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id 
ON enrollments(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id 
ON enrollments(course_id);

-- Composite index for user enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course 
ON enrollments(user_id, course_id);

-- Analyze tables to update statistics
ANALYZE courses;
ANALYZE enrollments;

-- Show created indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('courses', 'enrollments')
ORDER BY tablename, indexname;
