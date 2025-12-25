-- =============================================================================
-- DIGIAFRIQ DATABASE RESTORATION SCRIPT - FINAL PART
-- =============================================================================
-- Run this after all previous parts

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_profiles_updated_at BEFORE UPDATE ON affiliate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contest_participations_updated_at BEFORE UPDATE ON contest_participations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Business logic triggers
CREATE TRIGGER create_affiliate_profile_trigger AFTER UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION create_affiliate_profile();
CREATE TRIGGER update_enrollment_progress_trigger AFTER INSERT OR UPDATE ON lesson_progress FOR EACH ROW WHEN (NEW.is_completed = true) EXECUTE FUNCTION update_enrollment_progress();
CREATE TRIGGER create_commission_trigger AFTER UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION create_commission();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Affiliate profiles policies
CREATE POLICY "Affiliates can view their own profile" ON affiliate_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Affiliates can update their own profile" ON affiliate_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all affiliate profiles" ON affiliate_profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all affiliate profiles" ON affiliate_profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Affiliates can insert their own profile" ON affiliate_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can view their own courses" ON courses FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "Admins can view all courses" ON courses FOR SELECT USING (is_admin());
CREATE POLICY "Instructors can create courses" ON courses FOR INSERT WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "Instructors can update their own courses" ON courses FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "Admins can update all courses" ON courses FOR UPDATE USING (is_admin());

-- Modules policies
CREATE POLICY "Anyone can view modules of published courses" ON modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.is_published = true)
);
CREATE POLICY "Course instructors can view their course modules" ON modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "Admins can view all modules" ON modules FOR SELECT USING (is_admin());
CREATE POLICY "Course instructors can manage their course modules" ON modules FOR ALL USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.instructor_id = auth.uid())
);
CREATE POLICY "Admins can manage all modules" ON modules FOR ALL USING (is_admin());

-- Lessons policies
CREATE POLICY "Anyone can view lessons of published courses" ON lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM modules 
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.id = lessons.module_id AND courses.is_published = true
    )
);
CREATE POLICY "Course instructors can view their course lessons" ON lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM modules 
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.id = lessons.module_id AND courses.instructor_id = auth.uid()
    )
);
CREATE POLICY "Admins can view all lessons" ON lessons FOR SELECT USING (is_admin());
CREATE POLICY "Course instructors can manage their course lessons" ON lessons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM modules 
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.id = lessons.module_id AND courses.instructor_id = auth.uid()
    )
);
CREATE POLICY "Admins can manage all lessons" ON lessons FOR ALL USING (is_admin());

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON enrollments FOR SELECT USING (is_admin());
CREATE POLICY "Course instructors can view enrollments for their courses" ON enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE courses.id = enrollments.course_id AND courses.instructor_id = auth.uid())
);

-- Lesson progress policies
CREATE POLICY "Users can view their own lesson progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lesson progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lesson progress" ON lesson_progress FOR SELECT USING (is_admin());

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Affiliates can view payments they referred" ON payments FOR SELECT USING (
    EXISTS (SELECT 1 FROM affiliate_profiles WHERE affiliate_profiles.id = payments.affiliate_id AND affiliate_profiles.id = auth.uid())
);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (is_admin());
CREATE POLICY "System can create payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON payments FOR UPDATE USING (true);

-- Commissions policies
CREATE POLICY "Affiliates can view their own commissions" ON commissions FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can view all commissions" ON commissions FOR SELECT USING (is_admin());
CREATE POLICY "System can manage commissions" ON commissions FOR ALL USING (true);

-- Payouts policies
CREATE POLICY "Affiliates can view their own payouts" ON payouts FOR SELECT USING (auth.uid() = affiliate_id);
CREATE POLICY "Admins can view all payouts" ON payouts FOR SELECT USING (is_admin());
CREATE POLICY "Admins can manage payouts" ON payouts FOR ALL USING (is_admin());

-- Payout commissions policies
CREATE POLICY "Affiliates can view their payout commissions" ON payout_commissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM payouts WHERE payouts.id = payout_commissions.payout_id AND payouts.affiliate_id = auth.uid())
);
CREATE POLICY "Admins can manage payout commissions" ON payout_commissions FOR ALL USING (is_admin());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all notifications" ON notifications FOR SELECT USING (is_admin());

-- Contests policies
CREATE POLICY "Contests are viewable by authenticated users" ON contests FOR SELECT USING (auth.role() = 'authenticated');

-- Contest participations policies
CREATE POLICY "Users can view their own contest participations" ON contest_participations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own contest participations" ON contest_participations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contest participations" ON contest_participations FOR UPDATE USING (auth.uid() = user_id);

-- Tutorials policies
CREATE POLICY "Anyone can view published tutorials" ON tutorials FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage tutorials" ON tutorials FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT EXECUTE ON FUNCTION add_role_to_user(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION switch_active_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_role(UUID, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_affiliate_paid TO authenticated;
GRANT EXECUTE ON FUNCTION mark_learner_paid TO authenticated;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
SELECT 'DigiAfriq database restoration completed successfully!' as message;
