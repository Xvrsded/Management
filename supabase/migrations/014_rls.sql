-- Row Level Security (RLS) Policies
-- All RLS policies separated from table creation for clean architecture

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profiles" ON public.profiles;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- RW RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated read rw" ON public.rw;
DROP POLICY IF EXISTS "Allow staff manage rw" ON public.rw;

CREATE POLICY "Allow authenticated read rw" ON public.rw
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow staff manage rw" ON public.rw
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- RT RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated read rt" ON public.rt;
DROP POLICY IF EXISTS "Allow staff manage rt" ON public.rt;

CREATE POLICY "Allow authenticated read rt" ON public.rt
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow staff manage rt" ON public.rt
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- HOUSES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow staff read all houses" ON public.houses;
DROP POLICY IF EXISTS "Allow citizen read own house" ON public.houses;
DROP POLICY IF EXISTS "Allow staff manage houses" ON public.houses;
DROP POLICY IF EXISTS "Allow citizen insert own house" ON public.houses;

CREATE POLICY "Allow staff read all houses" ON public.houses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow citizen read own house" ON public.houses
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Allow staff manage houses" ON public.houses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow citizen insert own house" ON public.houses
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- FAMILIES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow staff read all families" ON public.families;
DROP POLICY IF EXISTS "Allow citizen read own family" ON public.families;
DROP POLICY IF EXISTS "Allow staff manage families" ON public.families;

CREATE POLICY "Allow staff read all families" ON public.families
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow citizen read own family" ON public.families
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.citizen_profiles cp
      WHERE cp.id = auth.uid()
      AND cp.family_id = public.families.id
    )
  );

CREATE POLICY "Allow staff manage families" ON public.families
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- CITIZEN PROFILES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow users to manage their own citizen profile" ON public.citizen_profiles;
DROP POLICY IF EXISTS "Allow staff to view all citizen profiles" ON public.citizen_profiles;

CREATE POLICY "Allow users to manage their own citizen profile" ON public.citizen_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow staff to view all citizen profiles" ON public.citizen_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- FAMILY MEMBERS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow staff read all family members" ON public.family_members;
DROP POLICY IF EXISTS "Allow citizen read own family members" ON public.family_members;
DROP POLICY IF EXISTS "Allow staff manage family members" ON public.family_members;

CREATE POLICY "Allow staff read all family members" ON public.family_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow citizen read own family members" ON public.family_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.citizen_profiles cp
      WHERE cp.id = auth.uid()
      AND cp.family_id = public.family_members.family_id
    )
  );

CREATE POLICY "Allow staff manage family members" ON public.family_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- ANNOUNCEMENTS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow staff insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow staff update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow staff delete announcements" ON public.announcements;

CREATE POLICY "Allow authenticated read announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow staff insert announcements" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff update announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff delete announcements" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- ACTIVITY LOGS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow staff read all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow users read own activity logs" ON public.activity_logs;

CREATE POLICY "Allow staff read all activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow users read own activity logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================
-- DUE PAYMENTS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow users to read their own payments" ON public.due_payments;
DROP POLICY IF EXISTS "Allow users to insert their own payments" ON public.due_payments;
DROP POLICY IF EXISTS "Allow staff to read all payments" ON public.due_payments;
DROP POLICY IF EXISTS "Allow staff to update payments" ON public.due_payments;

CREATE POLICY "Allow users to read their own payments" ON public.due_payments
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Allow users to insert their own payments" ON public.due_payments
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Allow staff to read all payments" ON public.due_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to update payments" ON public.due_payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- PAYMENT CATEGORIES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow anyone to read payment categories" ON public.payment_categories;
DROP POLICY IF EXISTS "Allow staff to manage payment categories" ON public.payment_categories;

CREATE POLICY "Allow anyone to read payment categories" ON public.payment_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow staff to manage payment categories" ON public.payment_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- PAYMENT TRANSACTIONS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow users to view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Allow users to insert their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Allow staff to view all transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Allow staff to update transaction states" ON public.payment_transactions;

CREATE POLICY "Allow users to view their own transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Allow users to insert their own transactions" ON public.payment_transactions
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Allow staff to view all transactions" ON public.payment_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to update transaction states" ON public.payment_transactions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- LETTER CATEGORIES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow public read access to active letter categories" ON public.letter_categories;
DROP POLICY IF EXISTS "Allow admin to manage letter categories" ON public.letter_categories;

CREATE POLICY "Allow public read access to active letter categories" ON public.letter_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin to manage letter categories" ON public.letter_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- LETTER REQUESTS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow citizens to read their own letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow citizens to submit letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow staff to read all letter requests" ON public.letter_requests;
DROP POLICY IF EXISTS "Allow staff to update letter requests" ON public.letter_requests;

CREATE POLICY "Allow citizens to read their own letter requests" ON public.letter_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Allow citizens to submit letter requests" ON public.letter_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow staff to read all letter requests" ON public.letter_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to update letter requests" ON public.letter_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- LETTER APPROVALS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow citizens to view their letter approvals" ON public.letter_approvals;
DROP POLICY IF EXISTS "Allow staff to view all letter approvals" ON public.letter_approvals;
DROP POLICY IF EXISTS "Allow staff to insert letter approvals" ON public.letter_approvals;

CREATE POLICY "Allow citizens to view their letter approvals" ON public.letter_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests lr
      WHERE lr.id = letter_request_id
      AND lr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow staff to view all letter approvals" ON public.letter_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow staff to insert letter approvals" ON public.letter_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- LETTER BOOKMARKS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow users to manage their own bookmarks" ON public.letter_bookmarks;

CREATE POLICY "Allow users to manage their own bookmarks" ON public.letter_bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id);

-- ============================================================
-- LETTER TEMPLATES RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow public read to templates" ON public.letter_templates;
DROP POLICY IF EXISTS "Allow admins to manage templates" ON public.letter_templates;

CREATE POLICY "Allow public read to templates" ON public.letter_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage templates" ON public.letter_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================
-- LETTER LOGS RLS POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Allow citizens to read their own letter logs" ON public.letter_logs;
DROP POLICY IF EXISTS "Allow staff to manage letter logs" ON public.letter_logs;

CREATE POLICY "Allow citizens to read their own letter logs" ON public.letter_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.letter_requests lr
      WHERE lr.id = letter_request_id
      AND lr.profile_id = auth.uid()
    )
  );

CREATE POLICY "Allow staff to manage letter logs" ON public.letter_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Payment Proofs Storage Policies
DROP POLICY IF EXISTS "Allow citizens to upload payment proof" ON storage.objects;
DROP POLICY IF EXISTS "Allow citizens to read their own payment proof" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff to read all payment proofs" ON storage.objects;

CREATE POLICY "Allow citizens to upload payment proof" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Allow citizens to read their own payment proof" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Allow staff to read all payment proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Letter Documents Storage Policies
DROP POLICY IF EXISTS "Allow citizens to upload supporting documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow citizens to read their own supporting documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow staff to view all supporting documents" ON storage.objects;

CREATE POLICY "Allow citizens to upload supporting documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'letter-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Allow citizens to read their own supporting documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'letter-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Allow staff to view all supporting documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'letter-documents'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

-- Signatures Storage Policies
DROP POLICY IF EXISTS "Allow staff to upload digital signature stamps" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to signatures" ON storage.objects;

CREATE POLICY "Allow staff to upload digital signature stamps" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'signatures'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

CREATE POLICY "Allow public read access to signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'signatures');
