-- =============================================================================
-- DIGIAFRIQ DATABASE RESTORATION SCRIPT - PART 3
-- =============================================================================
-- Run this after database_restoration_part2.sql

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_active_role ON profiles(active_role);
CREATE INDEX idx_profiles_learner_has_paid ON profiles(learner_has_paid);
CREATE INDEX idx_affiliate_profiles_code ON affiliate_profiles(affiliate_code);
CREATE INDEX idx_affiliate_profiles_has_paid ON affiliate_profiles(has_paid);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_modules_course ON modules(course_id, order_index);
CREATE INDEX idx_lessons_module ON lessons(module_id, order_index);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_reference ON payments(paystack_reference);
CREATE INDEX idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_payouts_affiliate ON payouts(affiliate_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX idx_contest_participations_contest_id ON contest_participations(contest_id);
CREATE INDEX idx_contest_participations_user_id ON contest_participations(user_id);
CREATE INDEX idx_tutorials_category ON tutorials(category);
CREATE INDEX idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX idx_tutorials_featured ON tutorials(is_featured);
CREATE INDEX idx_tutorials_published ON tutorials(is_published);

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM affiliate_profiles WHERE affiliate_code = code) INTO exists_check;
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is affiliate
CREATE OR REPLACE FUNCTION is_affiliate()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'affiliate'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a role to a user
CREATE OR REPLACE FUNCTION add_role_to_user(user_id UUID, new_role user_role)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET available_roles = array_append(available_roles, new_role)
    WHERE id = user_id
    AND NOT (new_role = ANY(available_roles));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch active role
CREATE OR REPLACE FUNCTION switch_active_role(user_id UUID, new_active_role user_role)
RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND new_active_role = ANY(available_roles)
    ) THEN
        UPDATE profiles
        SET active_role = new_active_role
        WHERE id = user_id;
    ELSE
        RAISE EXCEPTION 'User does not have access to role: %', new_active_role;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION user_has_role(user_id UUID, check_role user_role)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND check_role = ANY(available_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Continue with more functions in part 4...
