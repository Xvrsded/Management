-- Houses Table
-- Physical house units with FK to RT, soft delete support

CREATE TABLE IF NOT EXISTS public.houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rt_id UUID NOT NULL REFERENCES public.rt(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT NOT NULL,
  house_number TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_houses_rt_id ON public.houses(rt_id);
CREATE INDEX IF NOT EXISTS idx_houses_profile_id ON public.houses(profile_id);
CREATE INDEX IF NOT EXISTS idx_houses_house_number ON public.houses(house_number);
CREATE INDEX IF NOT EXISTS idx_houses_created_at ON public.houses(created_at);
CREATE INDEX IF NOT EXISTS idx_houses_deleted_at ON public.houses(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_houses_updated_at ON public.houses;
CREATE TRIGGER set_houses_updated_at
  BEFORE UPDATE ON public.houses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
