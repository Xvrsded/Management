-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REPORTS RLS POLICIES (Private by Default)
-- ============================================================

-- Warga can select their own reports or public ones
CREATE POLICY "Allow citizen read own reports or public" ON public.reports
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR is_public = true);

-- Warga can insert their own reports
CREATE POLICY "Allow citizen insert own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Staff (rt, rw, admin, superadmin) can read all reports
CREATE POLICY "Allow staff read all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Staff can update reports (change status, add notes)
CREATE POLICY "Allow staff update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- REPORT TIMELINE RLS POLICIES
-- ============================================================

-- Warga can view timeline for their own reports
CREATE POLICY "Allow citizen read own report timeline" ON public.report_timeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_id
      AND (r.profile_id = auth.uid() OR r.is_public = true)
    )
  );

-- Staff can read all report timelines
CREATE POLICY "Allow staff read all report timelines" ON public.report_timeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Staff can insert timeline events
CREATE POLICY "Allow staff insert report timelines" ON public.report_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================================

-- Warga/Users can read their own notifications
CREATE POLICY "Allow user read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- Warga/Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Allow user update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid());

-- System/Staff can insert notifications for users
CREATE POLICY "Allow staff insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );
