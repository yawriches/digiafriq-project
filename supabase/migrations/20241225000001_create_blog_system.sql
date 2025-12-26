-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image TEXT,
    meta_title TEXT,
    meta_description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_post_tags junction table
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON public.blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id ON public.blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_posts_updated_at();

-- Create function to generate slug from name for tags
CREATE OR REPLACE FUNCTION generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
    NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug = trim(both '-' from NEW.slug);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tag slug generation
DROP TRIGGER IF EXISTS trigger_generate_tag_slug ON public.blog_tags;
CREATE TRIGGER trigger_generate_tag_slug
    BEFORE INSERT OR UPDATE ON public.blog_tags
    FOR EACH ROW
    EXECUTE FUNCTION generate_tag_slug();

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
-- Public can read published posts
CREATE POLICY "Public can read published blog posts" ON public.blog_posts
    FOR SELECT USING (status = 'published');

-- Authenticated users can read all posts (for admin)
CREATE POLICY "Authenticated users can read all blog posts" ON public.blog_posts
    FOR SELECT TO authenticated USING (true);

-- Only admins can insert, update, delete blog posts
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for blog_tags
-- Public can read all tags
CREATE POLICY "Public can read blog tags" ON public.blog_tags
    FOR SELECT USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage blog tags" ON public.blog_tags
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS Policies for blog_post_tags
-- Public can read all post-tag relationships
CREATE POLICY "Public can read blog post tags" ON public.blog_post_tags
    FOR SELECT USING (true);

-- Only admins can manage post-tag relationships
CREATE POLICY "Admins can manage blog post tags" ON public.blog_post_tags
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create view for blog posts with tags
CREATE OR REPLACE VIEW public.blog_posts_with_tags AS
SELECT 
    bp.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', bt.id,
                'name', bt.name,
                'slug', bt.slug
            )
        ) FILTER (WHERE bt.id IS NOT NULL), 
        '[]'::json
    ) as tags
FROM public.blog_posts bp
LEFT JOIN public.blog_post_tags bpt ON bp.id = bpt.post_id
LEFT JOIN public.blog_tags bt ON bpt.tag_id = bt.id
GROUP BY bp.id, bp.title, bp.slug, bp.excerpt, bp.content, bp.featured_image, 
         bp.meta_title, bp.meta_description, bp.status, bp.author_id, 
         bp.published_at, bp.views, bp.created_at, bp.updated_at;

-- Grant permissions
GRANT SELECT ON public.blog_posts_with_tags TO authenticated, anon;
GRANT ALL ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO authenticated;

-- Insert some sample blog posts (using existing blog data from homepage)
INSERT INTO public.blog_posts (
    title, 
    slug, 
    excerpt, 
    content, 
    featured_image, 
    meta_title, 
    meta_description, 
    status, 
    author_id, 
    published_at
) VALUES 
(
    'Make money as International Students',
    'make-money-as-international-students',
    'Studying abroad is exciting—but it can also be expensive. Between tuition, accommodation, food, and other living expenses, international students often find themselves looking for ways to supplement their income.',
    '# Make Money as International Students

Studying abroad is an exciting journey, but it can also be financially challenging. Between tuition fees, accommodation costs, food expenses, and other living costs, international students often find themselves looking for ways to supplement their income.

## Legal Ways to Earn Money

### 1. On-Campus Jobs
Most countries allow international students to work on-campus without additional permits. These jobs include:
- Library assistant
- Campus tour guide
- Research assistant
- Cafeteria staff

### 2. Part-Time Work (Where Permitted)
Many countries allow international students to work part-time with restrictions:
- Usually limited to 20 hours per week during studies
- Full-time during holidays and breaks
- Requires proper work permits in some countries

### 3. Freelancing and Online Work
Digital opportunities that can be done from anywhere:
- Content writing
- Graphic design
- Tutoring online
- Social media management
- Web development

## Tips for Success

1. **Know Your Visa Restrictions**: Always check what work is permitted on your student visa
2. **Time Management**: Balance work with studies effectively
3. **Build Skills**: Use work opportunities to gain valuable experience
4. **Network**: Connect with other students and professionals
5. **Save Wisely**: Develop good financial habits

Remember, the primary purpose of your student visa is education, so always prioritize your studies while exploring these income opportunities.',
    '/blog/international-students.jpg',
    'How International Students Can Make Money While Studying Abroad',
    'Discover legal and practical ways for international students to earn money while studying abroad. Tips for balancing work and studies.',
    'published',
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
    '2025-09-16 10:00:00+00'
),
(
    'The UMM Super Win Challenge is HERE! 🎯 💖',
    'umm-super-win-challenge',
    'Are you ready to turn your hustle into massive wins? 💰 This is your chance to show up, sell hard, and transform your success story.',
    '# The UMM Super Win Challenge is HERE! 🎯 💖

Are you ready to turn your hustle into massive wins? 💰 This is your chance to show up, sell hard, and transform your success story.

## What is the UMM Super Win Challenge?

The UMM Super Win Challenge is our most exciting competition yet, designed to help you maximize your earning potential and achieve breakthrough results in your digital marketing journey.

## Challenge Details

### Duration
- **Start Date**: June 16, 2025
- **End Date**: July 16, 2025
- **Duration**: 30 days of intensive action

### Prizes
- 🥇 **1st Place**: $5,000 cash + Premium mentorship
- 🥈 **2nd Place**: $3,000 cash + Advanced training
- 🥉 **3rd Place**: $1,000 cash + Exclusive resources

### How to Participate

1. **Register**: Sign up for the challenge through your affiliate dashboard
2. **Set Goals**: Define your targets for the 30-day period
3. **Take Action**: Implement strategies and track your progress
4. **Submit Results**: Document your achievements with proof
5. **Win Big**: Celebrate your success and claim your prizes

## Success Strategies

### Week 1: Foundation
- Set up your systems
- Create your content calendar
- Build your audience

### Week 2: Momentum
- Launch your campaigns
- Engage with your community
- Optimize your approach

### Week 3: Acceleration
- Scale successful strategies
- Collaborate with others
- Push your limits

### Week 4: Victory
- Final push for results
- Document your journey
- Prepare for celebration

## Ready to Win?

This is more than just a challenge – it''s your opportunity to prove what you''re capable of and earn rewards that will accelerate your success.

**Join the UMM Super Win Challenge today and let''s make history together!** 🚀',
    '/blog/umm-super-win-challenge.jpg',
    'UMM Super Win Challenge - Transform Your Success Story',
    'Join the UMM Super Win Challenge and compete for amazing prizes while building your digital marketing success. 30 days to transform your results.',
    'published',
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
    '2025-06-16 10:00:00+00'
),
(
    'Introducing the BIG FISH CHALLENGE: Your Path to Success',
    'big-fish-challenge',
    'Transform your success story with the Big Fish Challenge. Learn the strategies and mindset shifts that separate the winners from the rest.',
    '# Introducing the BIG FISH CHALLENGE: Your Path to Success

Transform your success story with the Big Fish Challenge. This isn''t just another program – it''s a complete transformation system designed to help you think, act, and succeed like the big fish in your industry.

## What Makes a Big Fish?

Big fish don''t just swim with the current – they create their own waves. They understand that success isn''t about luck; it''s about strategy, persistence, and the right mindset.

### Key Characteristics of Big Fish:
- **Vision**: They see opportunities where others see obstacles
- **Action**: They move while others hesitate
- **Persistence**: They continue when others quit
- **Innovation**: They create solutions, not excuses
- **Leadership**: They inspire and influence others

## The Big Fish Challenge Framework

### Phase 1: Mindset Transformation (Days 1-10)
- Identify and eliminate limiting beliefs
- Develop a winner''s mindset
- Set ambitious but achievable goals
- Create your success blueprint

### Phase 2: Strategy Development (Days 11-20)
- Learn proven success strategies
- Develop your unique value proposition
- Build your personal brand
- Create multiple income streams

### Phase 3: Implementation & Scale (Days 21-30)
- Execute your strategies consistently
- Measure and optimize your results
- Scale what works
- Build systems for sustained growth

## Challenge Benefits

### Immediate Benefits:
- Clear direction and focus
- Proven strategies and tactics
- Supportive community
- Expert guidance and mentorship

### Long-term Benefits:
- Sustainable income growth
- Enhanced personal brand
- Expanded network
- Increased confidence and skills

## Success Stories

*"The Big Fish Challenge completely transformed how I approach my business. I went from struggling to make ends meet to building a six-figure income stream in just 6 months."* - Sarah M.

*"This challenge taught me that I was thinking too small. Now I''m playing in a completely different league."* - Marcus T.

## Ready to Become a Big Fish?

The question isn''t whether you can succeed – it''s whether you''re ready to do what it takes to join the ranks of the big fish.

**Are you ready to stop being a small fish in a big pond and start being a big fish in any pond you choose?**

Join the Big Fish Challenge today and start your transformation journey.',
    '/blog/big-fish-challenge.jpg',
    'Big Fish Challenge - Transform Your Success Story',
    'Join the Big Fish Challenge and learn the strategies that separate winners from the rest. Transform your mindset and scale your success.',
    'draft',
    (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1),
    NULL
);

-- Insert sample tags
INSERT INTO public.blog_tags (name) VALUES 
('Students'),
('Money'),
('International'),
('Education'),
('Challenge'),
('Success'),
('Growth'),
('Marketing'),
('Business'),
('Mindset');

-- Link posts to tags
INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT 
    bp.id,
    bt.id
FROM public.blog_posts bp, public.blog_tags bt
WHERE 
    (bp.slug = 'make-money-as-international-students' AND bt.name IN ('Students', 'Money', 'International', 'Education')) OR
    (bp.slug = 'umm-super-win-challenge' AND bt.name IN ('Challenge', 'Success', 'Marketing')) OR
    (bp.slug = 'big-fish-challenge' AND bt.name IN ('Challenge', 'Success', 'Growth', 'Business', 'Mindset'));
