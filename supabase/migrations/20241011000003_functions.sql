-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM affiliate_profiles WHERE affiliate_code = code) INTO exists_check;
        
        -- If code doesn't exist, break the loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create affiliate profile when user role changes to affiliate
CREATE OR REPLACE FUNCTION create_affiliate_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is being changed to affiliate and no affiliate profile exists
    IF NEW.role = 'affiliate' AND OLD.role != 'affiliate' THEN
        INSERT INTO affiliate_profiles (id, affiliate_code)
        VALUES (NEW.id, generate_affiliate_code())
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create affiliate profile
CREATE TRIGGER create_affiliate_profile_trigger
    AFTER UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_profile();

-- Function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(user_id_param UUID, course_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress DECIMAL;
BEGIN
    -- Get total lessons in the course
    SELECT COUNT(l.id) INTO total_lessons
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = course_id_param;
    
    -- Get completed lessons for the user
    SELECT COUNT(lp.id) INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN modules m ON m.id = l.module_id
    WHERE lp.user_id = user_id_param 
    AND m.course_id = course_id_param 
    AND lp.is_completed = true;
    
    -- Calculate progress percentage
    IF total_lessons > 0 THEN
        progress := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
    ELSE
        progress := 0;
    END IF;
    
    RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    enrollment_record RECORD;
    new_progress DECIMAL;
BEGIN
    -- Get enrollment record
    SELECT e.* INTO enrollment_record
    FROM enrollments e
    JOIN lessons l ON l.id = NEW.lesson_id
    JOIN modules m ON m.id = l.module_id
    WHERE e.user_id = NEW.user_id AND e.course_id = m.course_id;
    
    IF FOUND THEN
        -- Calculate new progress
        new_progress := calculate_course_progress(NEW.user_id, enrollment_record.course_id);
        
        -- Update enrollment
        UPDATE enrollments 
        SET 
            progress_percentage = new_progress,
            completed_at = CASE WHEN new_progress = 100 THEN NOW() ELSE NULL END,
            last_accessed_lesson_id = NEW.lesson_id
        WHERE id = enrollment_record.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update enrollment progress when lesson is completed
CREATE TRIGGER update_enrollment_progress_trigger
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW
    WHEN (NEW.is_completed = true)
    EXECUTE FUNCTION update_enrollment_progress();

-- Function to create commission when payment is completed
CREATE OR REPLACE FUNCTION create_commission()
RETURNS TRIGGER AS $$
DECLARE
    course_price DECIMAL;
    affiliate_commission_rate DECIMAL;
    commission_amount DECIMAL;
BEGIN
    -- Only create commission for completed payments with affiliate
    IF NEW.status = 'completed' AND NEW.affiliate_id IS NOT NULL AND OLD.status != 'completed' THEN
        -- Get course price
        SELECT price INTO course_price FROM courses WHERE id = NEW.course_id;
        
        -- Get affiliate commission rate
        SELECT commission_rate INTO affiliate_commission_rate 
        FROM affiliate_profiles WHERE id = NEW.affiliate_id;
        
        -- Calculate commission amount
        commission_amount := (course_price * affiliate_commission_rate) / 100;
        
        -- Create commission record
        INSERT INTO commissions (
            affiliate_id,
            payment_id,
            course_id,
            amount,
            commission_rate,
            status
        ) VALUES (
            NEW.affiliate_id,
            NEW.id,
            NEW.course_id,
            commission_amount,
            affiliate_commission_rate,
            'approved'
        );
        
        -- Update affiliate total earnings and referrals
        UPDATE affiliate_profiles 
        SET 
            total_earnings = total_earnings + commission_amount,
            total_referrals = total_referrals + 1
        WHERE id = NEW.affiliate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create commission
CREATE TRIGGER create_commission_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_commission();

-- Function to get course statistics
CREATE OR REPLACE FUNCTION get_course_stats(course_id_param UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_enrollments', (
            SELECT COUNT(*) FROM enrollments WHERE course_id = course_id_param
        ),
        'completed_enrollments', (
            SELECT COUNT(*) FROM enrollments 
            WHERE course_id = course_id_param AND completed_at IS NOT NULL
        ),
        'total_revenue', (
            SELECT COALESCE(SUM(amount), 0) FROM payments 
            WHERE course_id = course_id_param AND status = 'completed'
        ),
        'average_progress', (
            SELECT COALESCE(AVG(progress_percentage), 0) FROM enrollments 
            WHERE course_id = course_id_param
        ),
        'total_lessons', (
            SELECT COUNT(l.id) FROM lessons l
            JOIN modules m ON m.id = l.module_id
            WHERE m.course_id = course_id_param
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get affiliate dashboard stats
CREATE OR REPLACE FUNCTION get_affiliate_stats(affiliate_id_param UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_earnings', COALESCE(total_earnings, 0),
        'total_referrals', COALESCE(total_referrals, 0),
        'pending_commissions', (
            SELECT COALESCE(SUM(amount), 0) FROM commissions 
            WHERE affiliate_id = affiliate_id_param AND status = 'pending'
        ),
        'approved_commissions', (
            SELECT COALESCE(SUM(amount), 0) FROM commissions 
            WHERE affiliate_id = affiliate_id_param AND status = 'approved'
        ),
        'paid_commissions', (
            SELECT COALESCE(SUM(amount), 0) FROM commissions 
            WHERE affiliate_id = affiliate_id_param AND status = 'paid'
        ),
        'this_month_earnings', (
            SELECT COALESCE(SUM(c.amount), 0) FROM commissions c
            WHERE c.affiliate_id = affiliate_id_param 
            AND c.created_at >= date_trunc('month', CURRENT_DATE)
            AND c.status IN ('approved', 'paid')
        )
    ) INTO stats
    FROM affiliate_profiles 
    WHERE id = affiliate_id_param;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    user_id_param UUID,
    title_param TEXT,
    message_param TEXT,
    type_param TEXT DEFAULT 'info',
    action_url_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (user_id_param, title_param, message_param, type_param, action_url_param)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = user_id_param AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
