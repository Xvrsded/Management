-- Family Members Table
-- Additional family members with FK to families

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  nik TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('L', 'P')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_profile_id ON public.family_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_family_members_nik ON public.family_members(nik);
CREATE INDEX IF NOT EXISTS idx_family_members_created_at ON public.family_members(created_at);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_family_members_updated_at ON public.family_members;
CREATE TRIGGER set_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
