-- ========================================================
-- MIGRATION: Add Soft Delete to Persons (Bảo vệ dữ liệu phả hệ)
-- ========================================================
-- Adds deleted_at and deleted_by columns to public.persons.
-- When a member is deleted, instead of permanently removing the row and
-- cascading deletes to relationships, the row is marked with a timestamp
-- and the deleting user's id.
--
-- Active users only see non-deleted members. Administrators can view and
-- restore deleted members through restore_person().
-- ========================================================

-- 1. Add soft delete columns to persons table
ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) DEFAULT NULL;

-- 2. Create index for fast filtering of active/deleted records
CREATE INDEX IF NOT EXISTS idx_persons_deleted_at ON public.persons(deleted_at);

-- 3. Update RLS policies for public.persons
-- Active users only see members who have not been soft-deleted,
-- while administrators can see all records (including trash for restoration).
DROP POLICY IF EXISTS "Active users can view persons" ON public.persons;
CREATE POLICY "Active users can view persons" ON public.persons
  FOR SELECT TO authenticated
  USING (
    public.is_active_user() AND (deleted_at IS NULL OR public.is_admin())
  );

-- 4. Create RPC to restore a soft-deleted person
CREATE OR REPLACE FUNCTION public.restore_person(target_person_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() AND NOT public.is_editor() THEN
    RAISE EXCEPTION 'Access denied. Only administrators and editors can restore members.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.persons
  SET
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = target_person_id AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found or not currently in trash.'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_person(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_person(uuid) TO authenticated;

-- Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
