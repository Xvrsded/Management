-- Add INSERT policy for staff on dues and due_payments

DROP POLICY IF EXISTS "Allow staff to insert master dues" ON public.dues;
CREATE POLICY "Allow staff to insert master dues" ON public.dues
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Allow staff to insert payments" ON public.due_payments;
CREATE POLICY "Allow staff to insert payments" ON public.due_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('rt', 'rw', 'admin', 'superadmin')
    )
  );
