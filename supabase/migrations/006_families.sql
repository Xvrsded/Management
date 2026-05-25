-- Families Table
-- Family units with FK to houses, soft delete support

CREATE TABLE IF NOT EXISTS public.families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  kk_number TEXT NOT NULL UNIQUE,
  family_head_name TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_families_house_id ON public.families(house_id);
CREATE INDEX IF NOT EXISTS idx_families_kk_number ON public.families(kk_number);
CREATE INDEX IF NOT EXISTS idx_families_created_at ON public.families(created_at);
CREATE INDEX IF NOT EXISTS idx_families_deleted_at ON public.families(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_families_updated_at ON public.families;
CREATE TRIGGER set_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
