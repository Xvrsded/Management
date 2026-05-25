-- Landing page public metrics (run in Supabase SQL Editor)
-- Enables lightweight anon reads + realtime-friendly aggregate cache.

-- ---------------------------------------------------------------------------
-- 1. Public aggregate cache (safe for anon SELECT + Realtime)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_public_metrics (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  letters_in_process BIGINT NOT NULL DEFAULT 0,
  notifications_recent BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

INSERT INTO public.landing_public_metrics (id, letters_in_process, notifications_recent)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.landing_public_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read landing metrics" ON public.landing_public_metrics;
CREATE POLICY "Allow public read landing metrics"
  ON public.landing_public_metrics FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- 2. Refresh cache (SECURITY DEFINER — no row-level PII exposed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_landing_public_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_letters BIGINT;
  v_notifs BIGINT;
BEGIN
  SELECT COUNT(*)::BIGINT INTO v_letters
  FROM public.letter_requests
  WHERE status IS DISTINCT FROM 'finished'
    AND status IS DISTINCT FROM 'rejected';

  SELECT COUNT(*)::BIGINT INTO v_notifs
  FROM public.notifications
  WHERE created_at >= (NOW() - INTERVAL '7 days');

  UPDATE public.landing_public_metrics
  SET
    letters_in_process = COALESCE(v_letters, 0),
    notifications_recent = COALESCE(v_notifs, 0),
    updated_at = NOW()
  WHERE id = 1;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Landing stats RPC (aggregates only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_month_end DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;
  v_result JSON;
BEGIN
  PERFORM public.refresh_landing_public_metrics();

  SELECT json_build_object(
    'activeCitizens', (SELECT COUNT(*)::INT FROM public.citizen_profiles),
    'lettersInProcess', (
      SELECT COUNT(*)::INT FROM public.letter_requests
      WHERE status NOT IN ('finished', 'rejected')
    ),
    'duesThisMonth', COALESCE((
      SELECT SUM(amount)::NUMERIC
      FROM public.due_payments
      WHERE status IN ('verified', 'paid')
        AND (
          (due_date >= v_month_start AND due_date < v_month_end)
          OR (due_date IS NULL AND created_at >= v_month_start AND created_at < v_month_end)
        )
    ), 0),
    'activeAnnouncements', (
      SELECT COUNT(*)::INT FROM public.announcements
      WHERE created_at >= (NOW() - INTERVAL '30 days')
    ),
    'letterStatus', json_build_object(
      'pendingRt', (SELECT COUNT(*)::INT FROM public.letter_requests WHERE status = 'pending_rt'),
      'pendingRw', (SELECT COUNT(*)::INT FROM public.letter_requests WHERE status IN ('approved_rt', 'approved_rw')),
      'finished', (SELECT COUNT(*)::INT FROM public.letter_requests WHERE status = 'finished'),
      'inProcess', (SELECT COUNT(*)::INT FROM public.letter_requests WHERE status NOT IN ('finished', 'rejected'))
    ),
    'dues', json_build_object(
      'totalMonth', COALESCE((
        SELECT SUM(amount)::NUMERIC FROM public.due_payments
        WHERE due_date >= v_month_start AND due_date < v_month_end
      ), 0),
      'pending', (
        SELECT COUNT(*)::INT FROM public.due_payments
        WHERE status IN ('unpaid', 'pending', 'pending_verification')
          AND due_date >= v_month_start AND due_date < v_month_end
      ),
      'success', (
        SELECT COUNT(*)::INT FROM public.due_payments
        WHERE status IN ('verified', 'paid')
          AND due_date >= v_month_start AND due_date < v_month_end
      )
    ),
    'activitiesCount', (
      SELECT COUNT(*)::INT FROM public.activities
      WHERE event_date >= CURRENT_DATE
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_landing_public_metrics() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Triggers to keep public metrics fresh for Realtime subscribers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_refresh_landing_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_landing_public_metrics();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS landing_metrics_letter_requests ON public.letter_requests;
CREATE TRIGGER landing_metrics_letter_requests
  AFTER INSERT OR UPDATE OR DELETE ON public.letter_requests
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_landing_metrics();

DROP TRIGGER IF EXISTS landing_metrics_notifications ON public.notifications;
CREATE TRIGGER landing_metrics_notifications
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_landing_metrics();

-- ---------------------------------------------------------------------------
-- 5. Public read for landing previews (limited tables)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read announcements landing" ON public.announcements;
CREATE POLICY "Allow public read announcements landing"
  ON public.announcements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read upcoming activities landing" ON public.activities;
CREATE POLICY "Allow public read upcoming activities landing"
  ON public.activities FOR SELECT
  USING (event_date >= (CURRENT_DATE - INTERVAL '7 days'));

-- Enable Realtime on metrics table (Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_public_metrics;

SELECT public.refresh_landing_public_metrics();
