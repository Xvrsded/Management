-- RW Table
-- Rukun Warga (RW) administrative unit

CREATE TABLE IF NOT EXISTS public.rw (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rw_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rw_number ON public.rw(rw_number);
CREATE INDEX IF NOT EXISTS idx_rw_created_at ON public.rw(created_at);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_rw_updated_at ON public.rw;
CREATE TRIGGER set_rw_updated_at
  BEFORE UPDATE ON public.rw
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
