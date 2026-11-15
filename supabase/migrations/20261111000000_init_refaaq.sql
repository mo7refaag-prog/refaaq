-- ==============================================================================
-- مشروع تطبيق «رفاق» - صندوق الجمعية التعاونية
-- Migration: Initial Schema with RLS, Storage & Summary RPC
-- ==============================================================================

-- 1. أنواع البيانات المخصصة (Enums)
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE transaction_type AS ENUM ('bank_transfer', 'cash');
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE expense_category AS ENUM ('aid', 'asset_purchase', 'other');
CREATE TYPE asset_status AS ENUM ('available', 'borrowed');

-- 2. الجداول الرئيسية (Tables)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    phone TEXT,
    pin_code TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 15000.00 CHECK (amount > 0),
    type transaction_type NOT NULL DEFAULT 'bank_transfer',
    receipt_image_url TEXT,
    reference_number TEXT UNIQUE,
    status transaction_status NOT NULL DEFAULT 'pending',
    payment_month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category expense_category NOT NULL DEFAULT 'aid',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    status asset_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_month ON public.transactions(payment_month);
CREATE INDEX idx_transactions_ref ON public.transactions(reference_number);

-- 3. تريغر إنشاء الملف الشخصي تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'عضو جديد'),
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. إعداد الأمان وسياسات الوصول (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin());

-- Transactions Policies
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any transaction" 
ON public.transactions FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can insert any transaction" 
ON public.transactions FOR INSERT 
WITH CHECK (public.is_admin());

-- Expenses Policies
CREATE POLICY "All authenticated can view expenses" 
ON public.expenses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can manage expenses" 
ON public.expenses FOR ALL 
USING (public.is_admin());

-- Assets Policies
CREATE POLICY "All authenticated can view assets" 
ON public.assets FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Admins can manage assets" 
ON public.assets FOR ALL 
USING (public.is_admin());

-- 5. دالة الشفافية المالية الآمنة (RPC)
CREATE OR REPLACE FUNCTION public.get_fund_summary(target_month DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE)
RETURNS JSONB AS $$
DECLARE
  v_total_income NUMERIC(12, 2) := 0;
  v_total_expenses NUMERIC(12, 2) := 0;
  v_total_members INT := 0;
  v_paid_members INT := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total_income
  FROM public.transactions
  WHERE status = 'approved';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.expenses;

  SELECT COUNT(*) INTO v_total_members
  FROM public.profiles
  WHERE role = 'member';

  SELECT COUNT(DISTINCT user_id) INTO v_paid_members
  FROM public.transactions
  WHERE status = 'approved' 
    AND date_trunc('month', payment_month) = date_trunc('month', target_month);

  RETURN jsonb_build_object(
    'total_income', v_total_income,
    'total_expenses', v_total_expenses,
    'balance', (v_total_income - v_total_expenses),
    'total_members', v_total_members,
    'paid_members_count', v_paid_members,
    'unpaid_members_count', GREATEST(0, v_total_members - v_paid_members),
    'current_month', target_month
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_fund_summary(DATE) TO authenticated;

-- 6. تهيئة مخزن الإيصالات (Storage Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload receipts into their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users and admin can read receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'receipts' AND 
  ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);
