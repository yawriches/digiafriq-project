-- Migration to fix commission types and add missing referral tracking
-- This migration:
-- 1. Updates the commissions table to allow referral commission types
-- 2. Adds RLS policies for affiliate_links table
-- 3. Creates trigger to track affiliate link clicks

-- Step 1: Drop and recreate the commission_type check constraint to include referral types
ALTER TABLE public.commissions 
DROP CONSTRAINT IF EXISTS commissions_commission_type_check;

ALTER TABLE public.commissions 
ADD CONSTRAINT commissions_commission_type_check CHECK (
  commission_type::text = ANY (ARRAY[
    'learner_initial'::text,
    'dcs_addon'::text,
    'learner_renewal'::text,
    'learner_referral'::text,
    'affiliate_referral'::text
  ])
);

-- Step 2: Add RLS policies for affiliate_links table
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliates can view their own link clicks
CREATE POLICY "Affiliates can view own link clicks" ON public.affiliate_links
  FOR SELECT
  USING (affiliate_id = auth.uid());

-- Policy: Anyone can insert link clicks (for tracking)
CREATE POLICY "Anyone can insert link clicks" ON public.affiliate_links
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on affiliate_links" ON public.affiliate_links
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 3: Add RLS policies for affiliate_profiles table
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own affiliate profile
CREATE POLICY "Users can view own affiliate profile" ON public.affiliate_profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can update their own affiliate profile
CREATE POLICY "Users can update own affiliate profile" ON public.affiliate_profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Policy: Anyone can read affiliate profiles by referral code (for validation)
CREATE POLICY "Anyone can read affiliate profiles by code" ON public.affiliate_profiles
  FOR SELECT
  USING (true);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on affiliate_profiles" ON public.affiliate_profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 4: Add RLS policies for commissions table
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Affiliates can view their own commissions
CREATE POLICY "Affiliates can view own commissions" ON public.commissions
  FOR SELECT
  USING (affiliate_id = auth.uid());

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on commissions" ON public.commissions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 5: Create function to auto-create affiliate profile when user gets DCS addon
CREATE OR REPLACE FUNCTION public.create_affiliate_profile_on_dcs()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_base_url TEXT;
BEGIN
  -- Only trigger when has_digital_cashflow_addon becomes true
  IF NEW.has_digital_cashflow_addon = true AND (OLD.has_digital_cashflow_addon IS NULL OR OLD.has_digital_cashflow_addon = false) THEN
    -- Generate unique referral code
    v_referral_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Get base URL from environment or use default
    v_base_url := coalesce(current_setting('app.base_url', true), 'https://digiafriq.com');
    
    -- Insert affiliate profile if it doesn't exist
    INSERT INTO public.affiliate_profiles (
      id,
      referral_code,
      learner_link,
      dcs_link,
      total_earnings,
      available_balance,
      lifetime_referrals,
      active_referrals,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      v_referral_code,
      v_base_url || '/join/learner?ref=' || v_referral_code,
      v_base_url || '/join/dcs?ref=' || v_referral_code,
      0.00,
      0.00,
      0,
      0,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created affiliate profile for user % with code %', NEW.user_id, v_referral_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating affiliate profile
DROP TRIGGER IF EXISTS trigger_create_affiliate_profile ON public.user_memberships;
CREATE TRIGGER trigger_create_affiliate_profile
  AFTER INSERT OR UPDATE ON public.user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_affiliate_profile_on_dcs();

-- Step 6: Create function to update affiliate stats when commission is created
CREATE OR REPLACE FUNCTION public.update_affiliate_stats_on_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Update affiliate profile stats
  UPDATE public.affiliate_profiles
  SET 
    total_earnings = total_earnings + NEW.commission_amount,
    available_balance = CASE 
      WHEN NEW.status = 'available' THEN available_balance + NEW.commission_amount
      ELSE available_balance
    END,
    lifetime_referrals = lifetime_referrals + 1,
    active_referrals = active_referrals + 1,
    updated_at = now()
  WHERE id = NEW.affiliate_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating affiliate stats
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.commissions;
CREATE TRIGGER trigger_update_affiliate_stats
  AFTER INSERT ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_stats_on_commission();

-- Step 7: Create function to track affiliate link clicks
CREATE OR REPLACE FUNCTION public.track_affiliate_link_click(
  p_referral_code TEXT,
  p_link_type TEXT,
  p_visitor_ip TEXT DEFAULT NULL,
  p_visitor_country TEXT DEFAULT NULL,
  p_visitor_device TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_affiliate_id UUID;
  v_link_id UUID;
BEGIN
  -- Get affiliate ID from referral code
  SELECT id INTO v_affiliate_id
  FROM public.affiliate_profiles
  WHERE referral_code = p_referral_code;
  
  IF v_affiliate_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code: %', p_referral_code;
  END IF;
  
  -- Insert link click record
  INSERT INTO public.affiliate_links (
    affiliate_id,
    link_type,
    visitor_ip,
    visitor_country,
    visitor_device,
    clicked_at,
    converted,
    converted_user_id,
    converted_at
  )
  VALUES (
    v_affiliate_id,
    p_link_type,
    p_visitor_ip,
    p_visitor_country,
    p_visitor_device,
    now(),
    false,
    NULL,
    NULL
  )
  RETURNING id INTO v_link_id;
  
  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to mark affiliate link as converted
CREATE OR REPLACE FUNCTION public.convert_affiliate_link(
  p_referral_code TEXT,
  p_converted_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affiliate_id UUID;
BEGIN
  -- Get affiliate ID from referral code
  SELECT id INTO v_affiliate_id
  FROM public.affiliate_profiles
  WHERE referral_code = p_referral_code;
  
  IF v_affiliate_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update the most recent unconverted link click for this affiliate
  UPDATE public.affiliate_links
  SET 
    converted = true,
    converted_user_id = p_converted_user_id,
    converted_at = now()
  WHERE id = (
    SELECT id 
    FROM public.affiliate_links
    WHERE affiliate_id = v_affiliate_id
      AND converted = false
    ORDER BY clicked_at DESC
    LIMIT 1
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.track_affiliate_link_click TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_affiliate_link TO service_role;
