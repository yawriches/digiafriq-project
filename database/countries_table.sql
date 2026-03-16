-- Create countries table for managing available countries in signup
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT, -- ISO country code (optional)
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active countries
CREATE INDEX IF NOT EXISTS idx_countries_active ON public.countries(is_active, display_order);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active countries
CREATE POLICY "Allow public read access to active countries"
  ON public.countries
  FOR SELECT
  USING (is_active = true);

-- Allow admin full access
CREATE POLICY "Allow admin full access to countries"
  ON public.countries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default countries (Ghana as default)
INSERT INTO public.countries (name, code, is_active, is_default, display_order) VALUES
  ('Ghana', 'GH', true, true, 1),
  ('Nigeria', 'NG', true, false, 2),
  ('Kenya', 'KE', true, false, 3),
  ('South Africa', 'ZA', true, false, 4),
  ('Egypt', 'EG', true, false, 5),
  ('Morocco', 'MA', true, false, 6),
  ('Ethiopia', 'ET', true, false, 7),
  ('Tanzania', 'TZ', true, false, 8),
  ('Uganda', 'UG', true, false, 9),
  ('Cameroon', 'CM', true, false, 10),
  ('Other', 'XX', true, false, 99)
ON CONFLICT (name) DO NOTHING;

-- Create function to ensure only one default country
CREATE OR REPLACE FUNCTION ensure_single_default_country()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.countries
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default country enforcement
DROP TRIGGER IF EXISTS trigger_ensure_single_default_country ON public.countries;
CREATE TRIGGER trigger_ensure_single_default_country
  BEFORE INSERT OR UPDATE ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_country();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_countries_updated_at ON public.countries;
CREATE TRIGGER trigger_update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW
  EXECUTE FUNCTION update_countries_updated_at();
