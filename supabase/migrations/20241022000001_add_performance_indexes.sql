-- Performance Optimization: Add indexes for frequently queried columns
-- This migration adds indexes to speed up common queries in the application

-- Enrollments table indexes (used in learner dashboard and course browsing)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_enrolled_at ON enrollments(user_id, enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_completed ON enrollments(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Courses table indexes (used in browse courses and admin panel)
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);

-- Commissions table indexes (used in affiliate dashboard)
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(affiliate_id, created_at DESC);

-- Payouts table indexes (used in affiliate dashboard)
CREATE INDEX IF NOT EXISTS idx_payouts_affiliate_id ON payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(affiliate_id, created_at DESC);

-- Payments table indexes (used in admin dashboard)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Profiles table indexes (used across all dashboards)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Affiliate profiles table indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_id ON affiliate_profiles(id);

-- Course modules and lessons indexes (used in course player)
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id, order_index);

-- Add composite indexes for common join queries
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Add index for progress tracking queries
CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments(user_id, progress_percentage);

COMMENT ON INDEX idx_enrollments_user_id IS 'Speed up learner dashboard queries';
COMMENT ON INDEX idx_courses_published IS 'Speed up browse courses page';
COMMENT ON INDEX idx_commissions_affiliate_id IS 'Speed up affiliate dashboard queries';
COMMENT ON INDEX idx_payouts_affiliate_id IS 'Speed up affiliate payout queries';
COMMENT ON INDEX idx_payments_created_at IS 'Speed up admin payment monitoring';
