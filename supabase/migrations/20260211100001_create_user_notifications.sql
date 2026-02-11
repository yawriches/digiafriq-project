-- Create user_notifications table for per-user read tracking of broadcast notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_notification ON user_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification statuses
CREATE POLICY "Users can view own notification status"
    ON user_notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own notification statuses (for lazy creation)
CREATE POLICY "Users can insert own notification status"
    ON user_notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification statuses (mark as read)
CREATE POLICY "Users can update own notification status"
    ON user_notifications FOR UPDATE
    USING (auth.uid() = user_id);
