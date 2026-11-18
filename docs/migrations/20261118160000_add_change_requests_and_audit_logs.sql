-- ========================================================
-- MIGRATION: Add Change Requests & Audit Logs
-- ========================================================
-- Sprint 3: Collaboration, Change Requests & Audit Trail
-- Creates public.audit_logs table (append-only immutable log)
-- and public.change_requests table (proposals workflow),
-- along with RLS policies, indexes, triggers, and grants.
-- ========================================================

-- Ensure handle_updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create public.audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE', 'MERGE', 'APPROVE_PROPOSAL')),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Only Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- INSERT policy: Admins, editors, or system can append audit logs
DROP POLICY IF EXISTS "Admins and editors can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins and editors can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_editor() OR auth.uid() = performed_by);

-- Explicitly revoke UPDATE, DELETE, TRUNCATE to enforce append-only immutability
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM PUBLIC, anon, authenticated;

-- Grants for audit_logs
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;


-- 2. Create public.change_requests table
CREATE TABLE IF NOT EXISTS public.change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  proposed_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proposed_data JSONB NOT NULL,
  original_data JSONB,
  reason TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to auto-update updated_at on change_requests
DROP TRIGGER IF EXISTS tr_change_requests_updated_at ON public.change_requests;
CREATE TRIGGER tr_change_requests_updated_at
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for change_requests
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON public.change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_target_person ON public.change_requests(target_person_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_proposed_by ON public.change_requests(proposed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_created_at ON public.change_requests(created_at DESC);

-- Enable RLS on change_requests
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can view their own requests, Admins and Editors can view all
DROP POLICY IF EXISTS "Users can view relevant change requests" ON public.change_requests;
CREATE POLICY "Users can view relevant change requests" ON public.change_requests
  FOR SELECT TO authenticated
  USING (
    proposed_by_user_id = auth.uid() OR public.is_admin() OR public.is_editor()
  );

-- INSERT policy: Active users can submit proposals for themselves
DROP POLICY IF EXISTS "Active users can insert change requests" ON public.change_requests;
CREATE POLICY "Active users can insert change requests" ON public.change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_user() AND proposed_by_user_id = auth.uid()
  );

-- UPDATE policy: Admins and editors can update change requests (e.g., review / approve / reject)
DROP POLICY IF EXISTS "Admins and editors can update change requests" ON public.change_requests;
CREATE POLICY "Admins and editors can update change requests" ON public.change_requests
  FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR public.is_editor()
  )
  WITH CHECK (
    public.is_admin() OR public.is_editor()
  );

-- Table grants for change_requests
GRANT SELECT, INSERT, UPDATE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;

-- 3. Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
