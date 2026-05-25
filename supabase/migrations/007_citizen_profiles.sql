-- Citizen Profiles Table
-- Individual citizen data with FK to families, soft delete support

CREATE TABLE IF NOT EXISTS public.citizen_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  nik TEXT NOT NULL UNIQUE,
  kk TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL,
  rt TEXT NOT NULL,
  rw TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),
  place_of_birth TEXT,
  date_of_birth DATE,
  religion TEXT,
  occupation TEXT,
  marital_status TEXT,
  nationality TEXT DEFAULT 'WNI',
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_family_id ON public.citizen_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_nik ON public.citizen_profiles(nik);
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_kk ON public.citizen_profiles(kk);
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_created_at ON public.citizen_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_deleted_at ON public.citizen_profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_citizen_profiles_updated_at ON public.citizen_profiles;
CREATE TRIGGER set_citizen_profiles_updated_at
  BEFORE UPDATE ON public.citizen_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
