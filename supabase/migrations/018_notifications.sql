-- Notifications Table
-- Stores lightweight real-time notifications for users

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('success', 'info', 'warning', 'error')) DEFAULT 'info' NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for fast polling and unread counting
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
