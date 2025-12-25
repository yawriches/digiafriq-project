-- =============================================================================
-- DIGIAFRIQ DATABASE RESTORATION SCRIPT - PART 2
-- =============================================================================
-- Run this after database_restoration.sql

-- Enrollments table
CREATE TABLE enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_accessed_lesson_id UUID REFERENCES lessons(id),
    UNIQUE(user_id, course_id)
);

-- Lesson progress table
CREATE TABLE lesson_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    watch_time INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Payments table
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    course_id UUID REFERENCES courses(id),
    affiliate_id UUID REFERENCES affiliate_profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    paystack_reference TEXT UNIQUE,
    paystack_transaction_id TEXT,
    status payment_status DEFAULT 'pending',
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliate_profiles(id),
    payment_id UUID REFERENCES payments(id),
    course_id UUID REFERENCES courses(id),
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE payouts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliate_profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    status payout_status DEFAULT 'pending',
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    reference TEXT UNIQUE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout commissions junction table
CREATE TABLE payout_commissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payout_id UUID REFERENCES payouts(id) ON DELETE CASCADE,
    commission_id UUID REFERENCES commissions(id) ON DELETE CASCADE,
    UNIQUE(payout_id, commission_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contests table
CREATE TABLE contests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('upcoming', 'running', 'ended')) DEFAULT 'upcoming',
    prize_amount DECIMAL(10,2),
    prize_description TEXT,
    target_referrals INTEGER NOT NULL DEFAULT 0,
    max_participants INTEGER,
    rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contest participations table
CREATE TABLE contest_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referrals_count INTEGER DEFAULT 0,
    rank INTEGER,
    prize_won TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

-- Tutorials table
CREATE TABLE tutorials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('video', 'article', 'webinar')) DEFAULT 'video',
    duration TEXT,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
    views INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    thumbnail_url TEXT,
    video_url TEXT,
    content TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Continue with indexes and functions in part 3...
