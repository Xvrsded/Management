-- Reports Table (Laporan Aduan Warga)
-- Handles private citizen complaints with admin resolution tracking

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('submitted', 'reviewing', 'in_progress', 'resolved', 'rejected')) DEFAULT 'submitted' NOT NULL,
  photo_url TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  admin_notes TEXT,
  is_public BOOLEAN DEFAULT false NOT NULL,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON public.reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_reports_updated_at ON public.reports;
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Report Timeline Table
-- Tracks detailed progress and admin responses for each report
CREATE TABLE IF NOT EXISTS public.report_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_timeline_report_id ON public.report_timeline(report_id);
