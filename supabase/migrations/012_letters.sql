-- Letters Module Tables
-- Letter categories, requests, approvals, bookmarks, templates, and logs

-- Letter Categories Table
CREATE TABLE IF NOT EXISTS public.letter_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  form_fields JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for letter categories
CREATE INDEX IF NOT EXISTS idx_letter_categories_code ON public.letter_categories(code);
CREATE INDEX IF NOT EXISTS idx_letter_categories_is_active ON public.letter_categories(is_active);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_letter_categories_updated_at ON public.letter_categories;
CREATE TRIGGER set_letter_categories_updated_at
  BEFORE UPDATE ON public.letter_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Letter Requests Table
CREATE TABLE IF NOT EXISTS public.letter_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.letter_categories(id) ON DELETE SET NULL,
  letter_type TEXT,
  request_code TEXT UNIQUE NOT NULL,
  purpose TEXT NOT NULL,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('draft', 'pending_rt', 'approved_rt', 'approved_rw', 'finished', 'rejected')) DEFAULT 'draft' NOT NULL,
  support_document_url TEXT,
  letter_number TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  processed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  qr_token TEXT UNIQUE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for letter requests
CREATE INDEX IF NOT EXISTS idx_letter_requests_profile_id ON public.letter_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_letter_requests_category_id ON public.letter_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_letter_requests_status ON public.letter_requests(status);
CREATE INDEX IF NOT EXISTS idx_letter_requests_request_code ON public.letter_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_letter_requests_created_at ON public.letter_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_letter_requests_deleted_at ON public.letter_requests(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_letter_requests_updated_at ON public.letter_requests;
CREATE TRIGGER set_letter_requests_updated_at
  BEFORE UPDATE ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Letter Approvals Table
CREATE TABLE IF NOT EXISTS public.letter_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_request_id UUID REFERENCES public.letter_requests(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('rt', 'rw')),
  approver_id UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('approved', 'rejected')) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for letter approvals
CREATE INDEX IF NOT EXISTS idx_letter_approvals_letter_request_id ON public.letter_approvals(letter_request_id);
CREATE INDEX IF NOT EXISTS idx_letter_approvals_approver_id ON public.letter_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_letter_approvals_created_at ON public.letter_approvals(created_at);

-- Letter Bookmarks Table
CREATE TABLE IF NOT EXISTS public.letter_bookmarks (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.letter_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (profile_id, category_id)
);

-- Indexes for letter bookmarks
CREATE INDEX IF NOT EXISTS idx_letter_bookmarks_profile_id ON public.letter_bookmarks(profile_id);
CREATE INDEX IF NOT EXISTS idx_letter_bookmarks_category_id ON public.letter_bookmarks(category_id);

-- Letter Templates Table
CREATE TABLE IF NOT EXISTS public.letter_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.letter_categories(id) ON DELETE CASCADE UNIQUE NOT NULL,
  template_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for letter templates
CREATE INDEX IF NOT EXISTS idx_letter_templates_category_id ON public.letter_templates(category_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_letter_templates_updated_at ON public.letter_templates;
CREATE TRIGGER set_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Letter Logs Table
CREATE TABLE IF NOT EXISTS public.letter_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_request_id UUID REFERENCES public.letter_requests(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for letter logs
CREATE INDEX IF NOT EXISTS idx_letter_logs_letter_request_id ON public.letter_logs(letter_request_id);
CREATE INDEX IF NOT EXISTS idx_letter_logs_actor_id ON public.letter_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_letter_logs_created_at ON public.letter_logs(created_at);

-- Trigger for generating request code and token
CREATE OR REPLACE FUNCTION public.generate_request_code_and_token()
RETURNS TRIGGER AS $$
DECLARE
  seq_num TEXT;
  date_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(TO_CHAR(COUNT(*) + 1, 'FM000'), '001') INTO seq_num
  FROM public.letter_requests
  WHERE TO_CHAR(created_at, 'YYMM') = date_part;

  NEW.request_code := 'SR-' || date_part || '-' || seq_num;
  NEW.qr_token := encode(digest(NEW.id::text || gen_random_uuid()::text, 'sha256'), 'hex');
  NEW.submitted_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_letter_request_submitting ON public.letter_requests;
CREATE TRIGGER on_letter_request_submitting
  BEFORE INSERT ON public.letter_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_code_and_token();
