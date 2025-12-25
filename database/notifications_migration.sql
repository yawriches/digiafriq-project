-- Migration script to update existing notifications table
-- This script adds missing columns and updates the table structure

-- First, check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add target_audience column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'target_audience'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN target_audience text NOT NULL DEFAULT 'all';
        ALTER TABLE public.notifications ADD CONSTRAINT check_target_audience 
            CHECK (target_audience IN ('all', 'learners', 'affiliates', 'admins'));
        RAISE NOTICE 'Added target_audience column to notifications table';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN priority text NOT NULL DEFAULT 'normal';
        ALTER TABLE public.notifications ADD CONSTRAINT check_priority 
            CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        RAISE NOTICE 'Added priority column to notifications table';
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN expires_at timestamp with time zone NULL;
        RAISE NOTICE 'Added expires_at column to notifications table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE 'Added updated_at column to notifications table';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN is_active boolean NOT NULL DEFAULT true;
        RAISE NOTICE 'Added is_active column to notifications table';
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added created_by column to notifications table';
    END IF;

    -- Update existing records to have default values
    UPDATE public.notifications 
    SET target_audience = 'all' 
    WHERE target_audience IS NULL;

    UPDATE public.notifications 
    SET priority = 'normal' 
    WHERE priority IS NULL;

    UPDATE public.notifications 
    SET is_active = true 
    WHERE is_active IS NULL;

    UPDATE public.notifications 
    SET updated_at = created_at 
    WHERE updated_at IS NULL;

END $$;

-- Create user_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(notification_id, user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON public.notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification_user ON public.user_notifications(notification_id, user_id);

-- Enable RLS if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view targeted notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their notification status" ON public.user_notifications;
DROP POLICY IF EXISTS "Admins can view all user notification statuses" ON public.user_notifications;

-- Create policies
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view targeted notifications" ON public.notifications
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      target_audience = 'all' OR
      (target_audience = 'learners' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'learner'
      )) OR
      (target_audience = 'affiliates' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'affiliate'
      )) OR
      (target_audience = 'admins' AND EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      ))
    )
  );

-- User notifications policies
CREATE POLICY "Users can manage their notification status" ON public.user_notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user notification statuses" ON public.user_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create/update trigger function
DROP FUNCTION IF EXISTS create_user_notifications_for_new_notification();
CREATE OR REPLACE FUNCTION create_user_notifications_for_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user_notifications for all users based on target_audience
  IF NEW.target_audience = 'all' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles;
  ELSIF NEW.target_audience = 'learners' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'learner';
  ELSIF NEW.target_audience = 'affiliates' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'affiliate';
  ELSIF NEW.target_audience = 'admins' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, profiles.id
    FROM profiles
    WHERE profiles.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS create_user_notifications_trigger ON public.notifications;
CREATE TRIGGER create_user_notifications_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notifications_for_new_notification();

-- Create/update updated_at trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate updated_at trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
