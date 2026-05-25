-- RT Table
-- Rukun Tetangga (RT) administrative unit with FK to RW

CREATE TABLE IF NOT EXISTS public.rt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rw_id UUID NOT NULL REFERENCES public.rw(id) ON DELETE CASCADE,
  rt_number TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(rw_id, rt_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rt_rw_id ON public.rt(rw_id);
CREATE INDEX IF NOT EXISTS idx_rt_number ON public.rt(rt_number);
CREATE INDEX IF NOT EXISTS idx_rt_created_at ON public.rt(created_at);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_rt_updated_at ON public.rt;
CREATE TRIGGER set_rt_updated_at
  BEFORE UPDATE ON public.rt
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
