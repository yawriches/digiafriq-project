    -- Fix duplicate notifications issue
-- This script prevents duplicate user_notifications entries and fixes the trigger

-- Add unique constraint to prevent duplicates (remove if exists first)
ALTER TABLE public.user_notifications 
DROP CONSTRAINT IF EXISTS unique_notification_user;

ALTER TABLE public.user_notifications 
ADD CONSTRAINT unique_notification_user 
UNIQUE (notification_id, user_id);

-- Drop and recreate the trigger function to handle duplicates properly
DROP TRIGGER IF EXISTS create_user_notifications_trigger ON public.notifications;
DROP FUNCTION IF EXISTS create_user_notifications_for_new_notification();

CREATE OR REPLACE FUNCTION create_user_notifications_for_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_notifications for all users based on target_audience
  -- Use ON CONFLICT to handle duplicates gracefully
  
  IF NEW.target_audience = 'all' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  ELSIF NEW.target_audience = 'learners' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'learner'
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  ELSIF NEW.target_audience = 'affiliates' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'affiliate'
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  ELSIF NEW.target_audience = 'admins' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'admin'
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_user_notifications_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notifications_for_new_notification();

-- Clean up existing duplicates (optional - run once to clean data)
DELETE FROM public.user_notifications 
WHERE ctid NOT IN (
  SELECT min(ctid) 
  FROM public.user_notifications 
  GROUP BY notification_id, user_id
);
