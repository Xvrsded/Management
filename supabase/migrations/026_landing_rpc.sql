CREATE OR REPLACE FUNCTION get_landing_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_citizens_count INT;
  letters_in_process_count INT;
  active_announcements_count INT;
  activities_count INT;
  
  -- Letter Status
  letter_pending_rt INT;
  letter_pending_rw INT;
  letter_finished INT;
  letter_in_process INT;
  
  -- Dues
  dues_total_month NUMERIC;
  dues_pending INT;
  dues_success INT;
  
  month_start DATE := date_trunc('month', current_date);
  month_end DATE := (date_trunc('month', current_date) + interval '1 month')::date;
BEGIN
  -- Citizens
  SELECT count(*) INTO active_citizens_count FROM citizen_profiles;
  
  -- Activities (upcoming or today)
  SELECT count(*) INTO activities_count FROM activities WHERE activity_date >= current_date;
  
  -- Announcements (last 30 days)
  SELECT count(*) INTO active_announcements_count FROM announcements WHERE created_at >= current_date - interval '30 days';
  
  -- Letters
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending_rt'),
    COUNT(*) FILTER (WHERE status IN ('approved_rt', 'approved_rw')),
    COUNT(*) FILTER (WHERE status = 'finished'),
    COUNT(*) FILTER (WHERE status NOT IN ('finished', 'rejected'))
  INTO 
    letter_pending_rt,
    letter_pending_rw,
    letter_finished,
    letter_in_process
  FROM letter_requests;
  
  letters_in_process_count := COALESCE(letter_in_process, 0);
  
  -- Dues
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE status IN ('paid', 'verified')), 0),
    COUNT(*) FILTER (WHERE status IN ('unpaid', 'pending', 'pending_verification')),
    COUNT(*) FILTER (WHERE status IN ('paid', 'verified'))
  INTO
    dues_total_month,
    dues_pending,
    dues_success
  FROM due_payments
  WHERE due_date >= month_start AND due_date < month_end;
  
  RETURN json_build_object(
    'activeCitizens', COALESCE(active_citizens_count, 0),
    'lettersInProcess', COALESCE(letters_in_process_count, 0),
    'duesThisMonth', COALESCE(dues_total_month, 0),
    'activeAnnouncements', COALESCE(active_announcements_count, 0),
    'letterStatus', json_build_object(
      'pendingRt', COALESCE(letter_pending_rt, 0),
      'pendingRw', COALESCE(letter_pending_rw, 0),
      'finished', COALESCE(letter_finished, 0),
      'inProcess', COALESCE(letter_in_process, 0)
    ),
    'dues', json_build_object(
      'totalMonth', COALESCE(dues_total_month, 0),
      'pending', COALESCE(dues_pending, 0),
      'success', COALESCE(dues_success, 0)
    ),
    'activitiesCount', COALESCE(activities_count, 0)
  );
END;
$$;
