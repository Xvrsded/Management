-- Iuran (Due Payments) Table
-- Payment records with soft delete support

CREATE TABLE IF NOT EXISTS public.due_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('unpaid', 'pending', 'pending_verification', 'verified', 'rejected', 'paid')) DEFAULT 'unpaid',
  proof_url TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_due_payments_profile_id ON public.due_payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_due_payments_status ON public.due_payments(status);
CREATE INDEX IF NOT EXISTS idx_due_payments_due_date ON public.due_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_due_payments_created_at ON public.due_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_due_payments_deleted_at ON public.due_payments(deleted_at) WHERE deleted_at IS NOT NULL;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_due_payments_updated_at ON public.due_payments;
CREATE TRIGGER set_due_payments_updated_at
  BEFORE UPDATE ON public.due_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Payment Categories Table
CREATE TABLE IF NOT EXISTS public.payment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('bulanan', 'insidental', 'sukarela')),
  default_amount NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for payment categories
CREATE INDEX IF NOT EXISTS idx_payment_categories_kategori ON public.payment_categories(kategori);
CREATE INDEX IF NOT EXISTS idx_payment_categories_is_active ON public.payment_categories(is_active);

-- Apply updated_at trigger to payment_categories
DROP TRIGGER IF EXISTS set_payment_categories_updated_at ON public.payment_categories;
CREATE TRIGGER set_payment_categories_updated_at
  BEFORE UPDATE ON public.payment_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.due_payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  transaction_code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'waiting_verification', 'verified', 'rejected', 'expired')) DEFAULT 'pending' NOT NULL,
  proof_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_profile_id ON public.payment_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
