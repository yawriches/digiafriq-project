-- Create tutorials table for affiliate training content
CREATE TABLE IF NOT EXISTS tutorials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('video', 'article', 'webinar')) DEFAULT 'video',
    duration TEXT, -- e.g., "12:30" or "8 min read"
    category TEXT, -- e.g., "getting-started", "marketing", "social-media", "advanced"
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
    views INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    thumbnail_url TEXT,
    video_url TEXT,
    content TEXT, -- For article content or webinar details
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category);
CREATE INDEX IF NOT EXISTS idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX IF NOT EXISTS idx_tutorials_featured ON tutorials(is_featured);
CREATE INDEX IF NOT EXISTS idx_tutorials_published ON tutorials(is_published);

-- Insert sample tutorials
INSERT INTO tutorials (title, description, type, duration, category, difficulty, views, rating, is_featured) VALUES
('Getting Started as a DigiAfriq Affiliate', 'Learn the basics of affiliate marketing and how to set up your DigiAfriq affiliate account for success.', 'video', '12:30', 'getting-started', 'Beginner', 1250, 4.8, false),
('Creating Compelling Content That Converts', 'Master the art of creating content that drives sales and builds trust with your audience.', 'video', '18:45', 'marketing', 'Intermediate', 890, 4.9, false),
('Social Media Marketing for Affiliates', 'Leverage Facebook, Instagram, and other platforms to promote DigiAfriq courses effectively.', 'video', '22:15', 'social-media', 'Intermediate', 756, 4.7, false),
('Email Marketing Best Practices', 'Build and nurture an email list that converts subscribers into course buyers.', 'article', '8 min read', 'marketing', 'Intermediate', 634, 4.6, false),
('Understanding Your Affiliate Dashboard', 'Navigate your dashboard like a pro and track your performance metrics effectively.', 'video', '15:20', 'getting-started', 'Beginner', 1100, 4.8, false),
('Advanced Conversion Optimization Techniques', 'Take your affiliate marketing to the next level with advanced strategies and tactics.', 'webinar', '45:30', 'advanced', 'Advanced', 420, 4.9, false),
('Affiliate Marketing Masterclass 2024', 'A comprehensive guide to becoming a successful DigiAfriq affiliate, covering everything from setup to advanced strategies.', 'video', '2h 30m', 'marketing', 'Intermediate', 2500, 4.9, true),
('Building Your Personal Brand', 'Learn how to establish yourself as a trusted authority in your niche.', 'video', '16:40', 'marketing', 'Intermediate', 680, 4.7, false),
('WhatsApp Marketing for Affiliates', 'Discover how to use WhatsApp effectively to promote courses and engage with your audience.', 'video', '14:25', 'social-media', 'Beginner', 920, 4.6, false),
('Creating Effective Landing Pages', 'Design landing pages that convert visitors into buyers with proven techniques.', 'article', '10 min read', 'marketing', 'Intermediate', 540, 4.8, false),
('YouTube Marketing Strategies', 'Build a YouTube channel that drives traffic and sales to DigiAfriq courses.', 'video', '25:15', 'social-media', 'Advanced', 380, 4.9, false),
('Tracking and Analytics Mastery', 'Master the art of tracking your marketing efforts and optimizing for better results.', 'webinar', '38:20', 'advanced', 'Advanced', 290, 4.8, false),
('Setting Up Your Affiliate Links', 'Learn how to create, customize, and track your affiliate links effectively.', 'video', '10:15', 'getting-started', 'Beginner', 1450, 4.9, false),
('Instagram Reels for Affiliates', 'Create engaging Instagram Reels that promote courses and drive sales.', 'video', '12:50', 'social-media', 'Beginner', 780, 4.5, false),
('Affiliate Marketing Legal Compliance', 'Understand the legal requirements and best practices for affiliate marketing.', 'article', '12 min read', 'getting-started', 'Beginner', 450, 4.7, false);

-- Enable Row Level Security
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutorials
-- Allow all authenticated users to view published tutorials
CREATE POLICY "Anyone can view published tutorials" ON tutorials
    FOR SELECT USING (is_published = true);

-- Only admins can insert/update/delete tutorials (you can adjust this based on your needs)
CREATE POLICY "Admins can manage tutorials" ON tutorials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Update updated_at timestamp trigger
CREATE TRIGGER update_tutorials_updated_at 
    BEFORE UPDATE ON tutorials
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment tutorial views
CREATE OR REPLACE FUNCTION increment_tutorial_views(tutorial_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE tutorials
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = tutorial_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tutorials IS 'Affiliate training tutorials and educational content';
COMMENT ON COLUMN tutorials.type IS 'Type of tutorial: video, article, or webinar';
COMMENT ON COLUMN tutorials.duration IS 'Duration in format like "12:30" for videos or "8 min read" for articles';
COMMENT ON COLUMN tutorials.category IS 'Tutorial category: getting-started, marketing, social-media, advanced';
COMMENT ON COLUMN tutorials.is_featured IS 'Whether this tutorial should be featured on the tutorials page';
