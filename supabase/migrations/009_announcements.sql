-- Announcements Table
-- Community announcements with soft delete support

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_deleted_at ON public.announcements(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_announcements_updated_at ON public.announcements;
CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
