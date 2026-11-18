-- ========================================================
-- MIGRATION: Add Branches Table & Multi-Branch Hierarchy
-- ========================================================
-- Sprint 2: Core Genealogy & Multi-Branch Hierarchy
-- Creates public.branches table, links public.persons to branches,
-- configures RLS, indexes, triggers, and creates default root branch.
-- ========================================================

-- 1. Create public.branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  head_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add branch_id column to public.persons
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 3. Ensure handle_updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on branches
DROP TRIGGER IF EXISTS tr_branches_updated_at ON public.branches;
CREATE TRIGGER tr_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_parent ON public.branches(parent_branch_id);
CREATE INDEX IF NOT EXISTS idx_persons_branch_id ON public.persons(branch_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Active users can view branches
DROP POLICY IF EXISTS "Active users can view branches" ON public.branches;
CREATE POLICY "Active users can view branches" ON public.branches
  FOR SELECT TO authenticated
  USING (public.is_active_user());

-- INSERT policy: Admins and editors can insert branches
DROP POLICY IF EXISTS "Admins and editors can insert branches" ON public.branches;
CREATE POLICY "Admins and editors can insert branches" ON public.branches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_editor());

-- UPDATE policy: Admins and editors can update branches
DROP POLICY IF EXISTS "Admins and editors can update branches" ON public.branches;
CREATE POLICY "Admins and editors can update branches" ON public.branches
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_editor())
  WITH CHECK (public.is_admin() OR public.is_editor());

-- DELETE policy: Admins and editors can delete branches
DROP POLICY IF EXISTS "Admins and editors can delete branches" ON public.branches;
CREATE POLICY "Admins and editors can delete branches" ON public.branches
  FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_editor());

-- 6. Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;

-- 7. Initialize default branch and update existing members
DO $$
DECLARE
  default_branch_id UUID;
BEGIN
  SELECT id INTO default_branch_id
  FROM public.branches
  WHERE name = 'Đại Tộc Họ Chu - Toàn Họ'
  LIMIT 1;

  IF default_branch_id IS NULL THEN
    INSERT INTO public.branches (name, description, order_index)
    VALUES ('Đại Tộc Họ Chu - Toàn Họ', 'Chi nhánh gốc toàn thể gia tộc Họ Chu', 1)
    RETURNING id INTO default_branch_id;
  END IF;

  UPDATE public.persons
  SET branch_id = default_branch_id
  WHERE branch_id IS NULL;
END;
$$;

-- 8. Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
