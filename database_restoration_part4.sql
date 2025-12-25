-- =============================================================================
-- DIGIAFRIQ DATABASE RESTORATION SCRIPT - PART 4 (FINAL)
-- =============================================================================
-- Run this after database_restoration_part3.sql

-- =============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- =============================================================================

-- Function to create affiliate profile when user role changes to affiliate
CREATE OR REPLACE FUNCTION create_affiliate_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'affiliate' AND OLD.role != 'affiliate' THEN
        INSERT INTO affiliate_profiles (id, affiliate_code)
        VALUES (NEW.id, generate_affiliate_code())
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate course progress
CREATE OR REPLACE FUNCTION calculate_course_progress(user_id_param UUID, course_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress DECIMAL;
BEGIN
    SELECT COUNT(l.id) INTO total_lessons
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = course_id_param;
    
    SELECT COUNT(lp.id) INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN modules m ON m.id = l.module_id
    WHERE lp.user_id = user_id_param 
    AND m.course_id = course_id_param 
    AND lp.is_completed = true;
    
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
    SELECT e.* INTO enrollment_record
    FROM enrollments e
    JOIN lessons l ON l.id = NEW.lesson_id
    JOIN modules m ON m.id = l.module_id
    WHERE e.user_id = NEW.user_id AND e.course_id = m.course_id;
    
    IF FOUND THEN
        new_progress := calculate_course_progress(NEW.user_id, enrollment_record.course_id);
        
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

-- Function to create commission when payment is completed
CREATE OR REPLACE FUNCTION create_commission()
RETURNS TRIGGER AS $$
DECLARE
    course_price DECIMAL;
    affiliate_commission_rate DECIMAL;
    commission_amount DECIMAL;
BEGIN
    IF NEW.status = 'completed' AND NEW.affiliate_id IS NOT NULL AND OLD.status != 'completed' THEN
        SELECT price INTO course_price FROM courses WHERE id = NEW.course_id;
        
        SELECT commission_rate INTO affiliate_commission_rate 
        FROM affiliate_profiles WHERE id = NEW.affiliate_id;
        
        commission_amount := (course_price * affiliate_commission_rate) / 100;
        
        INSERT INTO commissions (
            affiliate_id, payment_id, course_id, amount, commission_rate, status
        ) VALUES (
            NEW.affiliate_id, NEW.id, NEW.course_id, commission_amount, affiliate_commission_rate, 'approved'
        );
        
        UPDATE affiliate_profiles 
        SET 
            total_earnings = total_earnings + commission_amount,
            total_referrals = total_referrals + 1
        WHERE id = NEW.affiliate_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to mark affiliate as paid
CREATE OR REPLACE FUNCTION mark_affiliate_paid(
  p_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_reference VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE affiliate_profiles
  SET 
    has_paid = TRUE,
    payment_date = NOW(),
    payment_amount = p_payment_amount,
    payment_reference = p_payment_reference
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to mark learner as paid
CREATE OR REPLACE FUNCTION mark_learner_paid(
  p_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_reference VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    learner_has_paid = TRUE,
    learner_payment_date = NOW(),
    learner_payment_amount = p_payment_amount,
    learner_payment_reference = p_payment_reference
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Function to increment tutorial views
CREATE OR REPLACE FUNCTION increment_tutorial_views(tutorial_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE tutorials
    SET views = views + 1, updated_at = NOW()
    WHERE id = tutorial_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update contest status based on dates
CREATE OR REPLACE FUNCTION update_contest_status()
RETURNS void AS $$
BEGIN
    UPDATE contests 
    SET status = CASE 
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        WHEN end_date < CURRENT_DATE THEN 'ended'
        ELSE 'running'
    END
    WHERE status != CASE 
        WHEN start_date > CURRENT_DATE THEN 'upcoming'
        WHEN end_date < CURRENT_DATE THEN 'ended'
        ELSE 'running'
    END;
END;
$$ LANGUAGE plpgsql;

-- Continue with triggers and RLS in part 5...
