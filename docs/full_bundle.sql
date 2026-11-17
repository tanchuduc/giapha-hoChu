-- GIAPHA-OS FULL BUNDLE

-- docs/schema.sql
-- ==========================================
-- GIAPHA-OS DATABASE SCHEMA
-- ==========================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ENUMS
-- Gender types for family members
DO $$ BEGIN
    CREATE TYPE public.gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Relationship types between family members
DO $$ BEGIN
    CREATE TYPE public.relationship_type_enum AS ENUM ('marriage', 'biological_child', 'adopted_child');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- System user roles
DO $$ BEGIN
    CREATE TYPE public.user_role_enum AS ENUM ('admin', 'editor', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- UTILITY FUNCTIONS
-- ==========================================

-- Function to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==========================================
-- TABLES (Data Preservation: No DROP TABLE commands)
-- ==========================================

-- PROFILES (Application users linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role_enum DEFAULT 'member' NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ, -- Set while an admin has locked the account (not just waiting for approval)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One-time approval links sent to the administrator.
-- The raw token is never stored in the database.
CREATE TABLE IF NOT EXISTS public.user_approval_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  notified_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PERSONS (Core entity for family tree)
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender public.gender_enum NOT NULL,
  
  -- Date components (allows for partial dates where only year is known)
  birth_year INT,
  birth_month INT,
  birth_day INT,
  death_year INT,
  death_month INT,
  death_day INT,
  death_lunar_year INT,
  death_lunar_month INT,
  death_lunar_day INT,
  
  is_deceased BOOLEAN NOT NULL DEFAULT FALSE,
  is_in_law BOOLEAN NOT NULL DEFAULT FALSE,
  birth_order INT,
  generation INT,
  other_names TEXT,
  avatar_url TEXT,
  note TEXT,
  burial_place TEXT, -- Nơi an táng (public, like the dates of death)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERSON_DETAILS_PRIVATE (Sensitive data with restricted RLS)
CREATE TABLE IF NOT EXISTS public.person_details_private (
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE PRIMARY KEY,
  phone_number TEXT,
  occupation TEXT,
  current_residence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RELATIONSHIPS (Links between persons)
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.relationship_type_enum NOT NULL,
  person_a UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  person_b UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent self-relationships
  CONSTRAINT no_self_relationship CHECK (person_a != person_b),
  
  -- Ensure unique relationships between pairs for a specific type
  UNIQUE(person_a, person_b, type)
);

-- CUSTOM_EVENTS (User-created events)
CREATE TABLE IF NOT EXISTS public.custom_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  -- 'none' = once; yearly_solar / yearly_lunar = every year on the solar or
  -- lunar day and month of event_date.
  recurrence TEXT NOT NULL DEFAULT 'none'
    CONSTRAINT custom_events_recurrence_check
    CHECK (recurrence IN ('none', 'yearly_solar', 'yearly_lunar')),
  created_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Relationship lookups
CREATE INDEX IF NOT EXISTS idx_relationships_person_a ON public.relationships(person_a);
CREATE INDEX IF NOT EXISTS idx_relationships_person_b ON public.relationships(person_b);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON public.relationships(type);

-- Person filtering and sorting
CREATE INDEX IF NOT EXISTS idx_persons_full_name ON public.persons(full_name);
CREATE INDEX IF NOT EXISTS idx_persons_generation ON public.persons(generation);
CREATE INDEX IF NOT EXISTS idx_persons_gender ON public.persons(gender);
CREATE INDEX IF NOT EXISTS idx_persons_is_deceased ON public.persons(is_deceased);
CREATE INDEX IF NOT EXISTS idx_persons_birth_year ON public.persons(birth_year);

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_user_approval_requests_expires_at
  ON public.user_approval_requests(expires_at);

-- Custom events lookups
CREATE INDEX IF NOT EXISTS idx_custom_events_date ON public.custom_events(event_date);
CREATE INDEX IF NOT EXISTS idx_custom_events_created_by ON public.custom_events(created_by);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_details_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Helper function to check if the current user has been approved.
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;
REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-- Helper function to check if user is editor
CREATE OR REPLACE FUNCTION PUBLIC.IS_EDITOR()
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'editor' AND is_active = true
  );
END;
$$;
revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to authenticated;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- PERSONS POLICIES
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;
DROP POLICY IF EXISTS "Active users can view persons" ON public.persons;
CREATE POLICY "Active users can view persons" ON public.persons FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Admins can manage persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can delete persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can delete persons" ON public.persons;

CREATE POLICY "Admins and Editors can insert persons" ON public.persons FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_editor());
CREATE POLICY "Admins and Editors can update persons" ON public.persons FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_editor()) WITH CHECK (public.is_admin() OR public.is_editor());
CREATE POLICY "Admins and Editors can delete persons" ON public.persons FOR DELETE TO authenticated USING (public.is_admin() OR public.is_editor());

-- PERSON_DETAILS_PRIVATE POLICIES
DROP POLICY IF EXISTS "Admins can view private details" ON public.person_details_private;
CREATE POLICY "Admins can view private details" ON public.person_details_private FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage private details" ON public.person_details_private;
CREATE POLICY "Admins can manage private details" ON public.person_details_private FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RELATIONSHIPS POLICIES
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;
DROP POLICY IF EXISTS "Active users can view relationships" ON public.relationships;
CREATE POLICY "Active users can view relationships" ON public.relationships FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Admins can manage relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can delete relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can delete relationships" ON public.relationships;

CREATE POLICY "Admins and Editors can insert relationships" ON public.relationships FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_editor());
CREATE POLICY "Admins and Editors can update relationships" ON public.relationships FOR UPDATE TO authenticated USING (public.is_admin() OR public.is_editor()) WITH CHECK (public.is_admin() OR public.is_editor());
CREATE POLICY "Admins and Editors can delete relationships" ON public.relationships FOR DELETE TO authenticated USING (public.is_admin() OR public.is_editor());

-- CUSTOM_EVENTS POLICIES
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;
DROP POLICY IF EXISTS "Active users can view custom events" ON public.custom_events;
CREATE POLICY "Active users can view custom events" ON public.custom_events FOR SELECT TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Authenticated users can insert custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Active users can insert custom events" ON public.custom_events;
CREATE POLICY "Active users can insert custom events" ON public.custom_events FOR INSERT TO authenticated WITH CHECK (public.is_active_user() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Active users can update own custom events" ON public.custom_events;
CREATE POLICY "Active users can update own custom events" ON public.custom_events FOR UPDATE TO authenticated USING (public.is_active_user() AND (auth.uid() = created_by OR public.is_admin())) WITH CHECK (public.is_active_user() AND (auth.uid() = created_by OR public.is_admin()));

DROP POLICY IF EXISTS "Users can delete own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Active users can delete own custom events" ON public.custom_events;
CREATE POLICY "Active users can delete own custom events" ON public.custom_events FOR DELETE TO authenticated USING (public.is_active_user() AND (auth.uid() = created_by OR public.is_admin()));

-- ==========================================
-- TRIGGERS
-- ==========================================

-- 1. Updated At Triggers
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_persons_updated_at ON public.persons;
CREATE TRIGGER tr_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_person_details_private_updated_at ON public.person_details_private;
CREATE TRIGGER tr_person_details_private_updated_at BEFORE UPDATE ON public.person_details_private FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_relationships_updated_at ON public.relationships;
CREATE TRIGGER tr_relationships_updated_at BEFORE UPDATE ON public.relationships FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_custom_events_updated_at ON public.custom_events;
CREATE TRIGGER tr_custom_events_updated_at BEFORE UPDATE ON public.custom_events FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Handle new user signup (Profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  is_first_user boolean;
BEGIN
  -- Serialize bootstrap so concurrent signups cannot create two administrators.
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  SELECT NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) INTO is_first_user;

  INSERT INTO public.profiles (id, role, is_active)
  VALUES (
    new.id, 
    CASE WHEN is_first_user THEN 'admin'::public.user_role_enum ELSE 'member'::public.user_role_enum END,
    CASE WHEN is_first_user THEN true ELSE false END
  );

  RETURN new;
END;
$$;

-- 3. Auto-confirm first user (Email verification)
CREATE OR REPLACE FUNCTION public.handle_first_user_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth
AS $$
BEGIN
  -- Serialize bootstrap so concurrent signups cannot create two administrators.
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) THEN
    NEW.email_confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for auto-confirmation
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_first_user_confirmation();

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Initialize 'avatars' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', false, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Active users can view avatars" ON storage.objects;
CREATE POLICY "Active users can view avatars" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND public.is_active_user());

DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Admins and editors can upload avatars" ON storage.objects;
CREATE POLICY "Admins and editors can upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (public.is_admin() OR public.is_editor()));

DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;
DROP POLICY IF EXISTS "Admins and editors can update avatars" ON storage.objects;
CREATE POLICY "Admins and editors can update avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (public.is_admin() OR public.is_editor()))
  WITH CHECK (bucket_id = 'avatars' AND (public.is_admin() OR public.is_editor()));

DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;
DROP POLICY IF EXISTS "Admins and editors can delete avatars" ON storage.objects;
CREATE POLICY "Admins and editors can delete avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (public.is_admin() OR public.is_editor()));

-- ==========================================
-- ADMIN RPC FUNCTIONS
-- ==========================================

-- Custom type for get_admin_users
DROP TYPE IF EXISTS public.admin_user_data CASCADE;
CREATE TYPE public.admin_user_data AS (
    id uuid,
    email text,
    role public.user_role_enum,
    created_at timestamptz,
    is_active boolean
);

-- 1. Get List of Users for Admin
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS SETOF public.admin_user_data
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    RETURN QUERY
    SELECT au.id, au.email::text, p.role, au.created_at, p.is_active
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    ORDER BY au.created_at DESC;
END;
$$;

-- 2. Update User Role
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot change your own role.';
    END IF;

    IF new_role::public.user_role_enum <> 'admin'::public.user_role_enum
       AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
       AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last active administrator.';
    END IF;

    UPDATE public.profiles
    SET role = new_role::public.user_role_enum
    WHERE id = target_user_id;
END;
$$;

-- 3. Delete User Account
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;
    
    IF auth.uid() = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete yourself.';
    END IF;

    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 4. Admin Create New User
-- IMPORTANT: All token/string columns MUST be set to '' (empty string), NOT NULL.
-- Supabase Auth's Go scanner crashes with "converting NULL to string is unsupported"
-- if any of these fields are NULL.
CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email text, 
  new_password text, 
  new_role text,
  new_active boolean
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
    new_id uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF length(trim(new_email)) < 3 OR position('@' IN new_email) < 2 THEN
        RAISE EXCEPTION 'Invalid email.';
    END IF;
    IF length(new_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters.';
    END IF;

    new_id := gen_random_uuid();

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, 
        email_confirmed_at,         -- Auto-verify: skip email confirmation
        confirmation_token,         -- Must be '' not NULL (Supabase Auth Go scanner)
        recovery_token,             -- Must be '' not NULL
        email_change_token_new,     -- Must be '' not NULL
        email_change_token_current, -- Must be '' not NULL
        reauthentication_token,     -- Must be '' not NULL
        email_change,               -- Must be '' not NULL
        phone_change,               -- Must be '' not NULL
        phone_change_token,         -- Must be '' not NULL
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
        new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        new_email, extensions.crypt(new_password, extensions.gen_salt('bf')),
        now(),
        '', '', '', '', '', '', '', '',
        '{"provider":"email","providers":["email"]}', '{}', now(), now()
    );

    INSERT INTO public.profiles (id, role, is_active, created_at, updated_at)
    VALUES (new_id, new_role::public.user_role_enum, new_active, now(), now())
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;
    
    RETURN new_id;
END;
$function$;

-- 5. Set User Active Status (Approve/Block)
CREATE OR REPLACE FUNCTION public.set_user_active_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot change your own active status.';
    END IF;

    IF new_status = false
       AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
       AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1 THEN
        RAISE EXCEPTION 'Cannot deactivate the last active administrator.';
    END IF;

    UPDATE public.profiles
    SET is_active = new_status
    WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_user(text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_user_active_status(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_active_status(uuid, boolean) TO authenticated;

-- ========================================================
-- 9. GALLERY MODULE
-- ========================================================

-- Add gallery table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  event_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Policy: Chỉ tài khoản đã được admin duyệt mới xem được
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;
DROP POLICY IF EXISTS "Active users can view gallery" ON public.gallery_items;
CREATE POLICY "Active users can view gallery" ON public.gallery_items FOR SELECT TO authenticated USING (public.is_active_user());

-- Policy: chỉ admin quản lý file gallery; member/editor chỉ xem.
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Active users can insert gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;
CREATE POLICY "Admins can insert gallery" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND auth.uid() = created_by);

-- Policy: Chỉ admin hoặc người tạo mới được sửa
DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Active users can update gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;
CREATE POLICY "Admins can update gallery" ON public.gallery_items FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policy: Chỉ admin hoặc người tạo mới được xóa
DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Active users can delete gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;
CREATE POLICY "Admins can delete gallery" ON public.gallery_items FOR DELETE TO authenticated USING (public.is_admin());

-- Members tagged in a gallery photo (many to many). Same access as gallery_items.
CREATE TABLE IF NOT EXISTS public.gallery_item_persons (
  gallery_item_id uuid NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  PRIMARY KEY (gallery_item_id, person_id)
);
CREATE INDEX IF NOT EXISTS gallery_item_persons_person_id_idx ON public.gallery_item_persons (person_id);
ALTER TABLE public.gallery_item_persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Active users can view gallery tags" ON public.gallery_item_persons FOR SELECT TO authenticated USING (public.is_active_user());
DROP POLICY IF EXISTS "Admins can insert gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can insert gallery tags" ON public.gallery_item_persons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can update gallery tags" ON public.gallery_item_persons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can delete gallery tags" ON public.gallery_item_persons FOR DELETE TO authenticated USING (public.is_admin());

-- ========================================================
-- 10. STORAGE BUCKETS
-- ========================================================

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery', 'gallery', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Active users can view gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view gallery files" ON storage.objects;
CREATE POLICY "Active users can view gallery files"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'gallery' AND public.is_active_user() );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Active users can upload gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload gallery files" ON storage.objects;
CREATE POLICY "Admins can upload gallery files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'gallery' AND public.is_admin() );

DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Active users can update gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update gallery files" ON storage.objects;
CREATE POLICY "Admins can update gallery files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'gallery' AND public.is_admin() )
WITH CHECK ( bucket_id = 'gallery' AND public.is_admin() );

DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "Active users can delete gallery files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete gallery files" ON storage.objects;
CREATE POLICY "Admins can delete gallery files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'gallery' AND public.is_admin() );

-- ========================================================
-- 11. TABLE GRANTS FOR THE DATA API
-- ========================================================

-- Supabase projects created after 2026-05-30 no longer auto-grant table
-- privileges in the public schema to anon, authenticated, and service_role,
-- so PostgREST fails with 42501 "permission denied" even though the RLS
-- policies above are in place. The matrix mirrors the policies: anon gets
-- nothing (the app is login-only and every policy is TO authenticated),
-- authenticated gets the operations a policy allows, service_role gets ALL
-- for the server-side approval and notification flows (BYPASSRLS does not
-- replace GRANT). Future migrations that create a table in public must add
-- explicit grants too — see docs/migrations/20260904000000_add_data_api_table_grants.sql.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON public.profiles FROM anon;
-- Profiles are written only by the signup trigger and admin RPCs, so
-- clients only ever need to read them.
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO authenticated;
GRANT ALL ON public.persons TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_details_private TO authenticated;
GRANT ALL ON public.person_details_private TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationships TO authenticated;
GRANT ALL ON public.relationships TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_events TO authenticated;
GRANT ALL ON public.custom_events TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_item_persons TO authenticated;
GRANT ALL ON public.gallery_item_persons TO service_role;

-- Server-only table: the deny-by-default RLS policy keeps clients out, but
-- the one-time approval links read and claim rows through service_role.
REVOKE ALL ON public.user_approval_requests FROM anon, authenticated;
GRANT ALL ON public.user_approval_requests TO service_role;


-- docs/migrations/20260312015736_add_lunar_death_date.sql
-- Add lunar death date fields to persons table

ALTER TABLE "public"."persons"
  ADD COLUMN IF NOT EXISTS "death_lunar_day" smallint,
  ADD COLUMN IF NOT EXISTS "death_lunar_month" smallint,
  ADD COLUMN IF NOT EXISTS "death_lunar_year" smallint;


-- docs/migrations/20260320230020_add_editor_permission.sql
-- Create or replace function to check if user is an editor

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_editor () returns boolean language plpgsql security definer
SET
  search_path = public AS $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'editor'
      and is_active = true
  );
end;
$$;

REVOKE ALL ON function public.is_editor ()
FROM
  public;

GRANT
EXECUTE ON function public.is_editor () TO authenticated;

-- Drop existing admin-only policies
DROP POLICY if EXISTS "Admins can insert persons" ON public.persons;

DROP POLICY if EXISTS "Admins can update persons" ON public.persons;

DROP POLICY if EXISTS "Admins can delete persons" ON public.persons;

DROP POLICY if EXISTS "Admins and Editors can insert persons" ON public.persons;

DROP POLICY if EXISTS "Admins and Editors can update persons" ON public.persons;

DROP POLICY if EXISTS "Admins and Editors can delete persons" ON public.persons;

-- INSERT
CREATE POLICY "Admins and Editors can insert persons" ON public.persons FOR insert TO authenticated
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

-- UPDATE
CREATE POLICY "Admins and Editors can update persons" ON public.persons
FOR UPDATE
  TO authenticated USING (
    public.is_admin ()
    OR public.is_editor ()
  )
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

-- DELETE
CREATE POLICY "Admins and Editors can delete persons" ON public.persons FOR delete TO authenticated USING (
  public.is_admin ()
  OR public.is_editor ()
);

DROP POLICY if EXISTS "Admins can insert relationships" ON public.relationships;

DROP POLICY if EXISTS "Admins can update relationships" ON public.relationships;

DROP POLICY if EXISTS "Admins can delete relationships" ON public.relationships;

DROP POLICY if EXISTS "Admins and Editors can insert relationships" ON public.relationships;

DROP POLICY if EXISTS "Admins and Editors can update relationships" ON public.relationships;

DROP POLICY if EXISTS "Admins and Editors can delete relationships" ON public.relationships;

-- INSERT
CREATE POLICY "Admins and Editors can insert relationships" ON public.relationships FOR insert TO authenticated
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

-- UPDATE
CREATE POLICY "Admins and Editors can update relationships" ON public.relationships
FOR UPDATE
  TO authenticated USING (
    public.is_admin ()
    OR public.is_editor ()
  )
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

-- DELETE
CREATE POLICY "Admins and Editors can delete relationships" ON public.relationships FOR delete TO authenticated USING (
  public.is_admin ()
  OR public.is_editor ()
);


-- docs/migrations/20260524125731_add_gallery.sql
-- Gallery module. Requires the base schema helpers public.is_admin() and
-- public.is_active_user(). This module is private-by-default.

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  event_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users (id)
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can view gallery" ON public.gallery_items;

CREATE POLICY "Active users can view gallery" ON public.gallery_items FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can insert gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;

CREATE POLICY "Admins can insert gallery" ON public.gallery_items FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_admin ()
    AND auth.uid () = created_by
  );

DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can update gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;

CREATE POLICY "Admins can update gallery" ON public.gallery_items
FOR UPDATE
  TO authenticated USING (public.is_admin ())
WITH
  CHECK (public.is_admin ());

DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can delete gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;

CREATE POLICY "Admins can delete gallery" ON public.gallery_items FOR DELETE TO authenticated USING (public.is_admin ());

INSERT INTO
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'gallery',
    'gallery',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[];

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

DROP POLICY IF EXISTS "Active users can view gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can view gallery files" ON storage.objects;

CREATE POLICY "Active users can view gallery files" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_active_user ()
  );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

DROP POLICY IF EXISTS "Active users can upload gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload gallery files" ON storage.objects;

CREATE POLICY "Admins can upload gallery files" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;

DROP POLICY IF EXISTS "Active users can update gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can update gallery files" ON storage.objects;

CREATE POLICY "Admins can update gallery files" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_admin ()
  )
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Active users can delete gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can delete gallery files" ON storage.objects;

CREATE POLICY "Admins can delete gallery files" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'gallery'
  AND public.is_admin ()
);


-- docs/migrations/20260831140135_security_and_approval_hardening.sql
-- Combined security and approval hardening for existing installations.
-- Run after docs/schema.sql and the feature migrations.
-- This migration is idempotent and keeps pending users out of all data.

-- 1. Member access hardening
-- Security fix: new users must be approved before they can read family data.
-- Existing active accounts are preserved as already-approved accounts. New
-- accounts are created as inactive by the trigger below.

CREATE OR REPLACE FUNCTION public.is_admin () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_user ()
FROM
  PUBLIC;

GRANT
EXECUTE ON FUNCTION public.is_active_user () TO authenticated;

CREATE OR REPLACE FUNCTION public.is_editor () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'editor' AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_editor ()
FROM
  PUBLIC;

GRANT
EXECUTE ON FUNCTION public.is_editor () TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user () RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  SELECT NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) INTO is_first_user;

  INSERT INTO public.profiles (id, role, is_active)
  VALUES (
    NEW.id,
    CASE WHEN is_first_user THEN 'admin'::public.user_role_enum ELSE 'member'::public.user_role_enum END,
    is_first_user
  );

  RETURN NEW;
END;
$$;

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;

DROP POLICY IF EXISTS "Active users can view persons" ON public.persons;

CREATE POLICY "Active users can view persons" ON public.persons FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;

DROP POLICY IF EXISTS "Active users can view relationships" ON public.relationships;

CREATE POLICY "Active users can view relationships" ON public.relationships FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can view custom events" ON public.custom_events;

CREATE POLICY "Active users can view custom events" ON public.custom_events FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Authenticated users can insert custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can insert custom events" ON public.custom_events;

CREATE POLICY "Active users can insert custom events" ON public.custom_events FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_active_user ()
    AND auth.uid () = created_by
  );

DROP POLICY IF EXISTS "Users can update own custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can update own custom events" ON public.custom_events;

CREATE POLICY "Active users can update own custom events" ON public.custom_events
FOR UPDATE
  TO authenticated USING (
    public.is_active_user ()
    AND (
      auth.uid () = created_by
      OR public.is_admin ()
    )
  )
WITH
  CHECK (
    public.is_active_user ()
    AND (
      auth.uid () = created_by
      OR public.is_admin ()
    )
  );

DROP POLICY IF EXISTS "Users can delete own custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can delete own custom events" ON public.custom_events;

CREATE POLICY "Active users can delete own custom events" ON public.custom_events FOR DELETE TO authenticated USING (
  public.is_active_user ()
  AND (
    auth.uid () = created_by
    OR public.is_admin ()
  )
);

DO $$
BEGIN
  IF to_regclass('public.gallery_items') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;
    DROP POLICY IF EXISTS "Active users can view gallery" ON public.gallery_items;
    DROP POLICY IF EXISTS "Admins can view gallery" ON public.gallery_items;
    CREATE POLICY "Active users can view gallery"
    ON public.gallery_items FOR SELECT TO authenticated
    USING (public.is_active_user());

    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
    DROP POLICY IF EXISTS "Active users can insert gallery" ON public.gallery_items;
    DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;
    CREATE POLICY "Admins can insert gallery"
    ON public.gallery_items FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() AND auth.uid() = created_by);

    DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
    DROP POLICY IF EXISTS "Active users can update gallery" ON public.gallery_items;
    DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;
    CREATE POLICY "Admins can update gallery"
    ON public.gallery_items FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
    DROP POLICY IF EXISTS "Active users can delete gallery" ON public.gallery_items;
    DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;
    CREATE POLICY "Admins can delete gallery"
    ON public.gallery_items FOR DELETE TO authenticated
    USING (public.is_admin());
  END IF;
END;
$$;

-- Gallery objects must not remain publicly readable after the table is protected.
UPDATE storage.buckets
SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[]
WHERE
  id = 'gallery';

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

DROP POLICY IF EXISTS "Active users can view gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can view gallery files" ON storage.objects;

CREATE POLICY "Active users can view gallery files" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_active_user ()
  );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

DROP POLICY IF EXISTS "Active users can upload gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload gallery files" ON storage.objects;

CREATE POLICY "Admins can upload gallery files" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;

DROP POLICY IF EXISTS "Active users can update gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can update gallery files" ON storage.objects;

CREATE POLICY "Admins can update gallery files" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_admin ()
  )
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Active users can delete gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can delete gallery files" ON storage.objects;

CREATE POLICY "Admins can delete gallery files" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'gallery'
  AND public.is_admin ()
);


-- 2. User approval workflow
-- User approval workflow: newly registered users stay pending after email confirmation.
-- New accounts remain pending after email confirmation until an admin approves them.

ALTER TABLE public.profiles
ALTER COLUMN is_active
SET DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.user_approval_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  notified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_approval_requests_expires_at ON public.user_approval_requests (expires_at);

ALTER TABLE public.user_approval_requests ENABLE ROW LEVEL SECURITY;

-- Keep this table inaccessible to browser clients. The server-only service-role
-- client is used by the notification and approval routes.
DROP POLICY IF EXISTS "No client access to approval requests" ON public.user_approval_requests;

CREATE OR REPLACE FUNCTION public.handle_new_user () RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- The first account becomes the initial admin; every later account is pending.
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  SELECT NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) INTO is_first_user;

  INSERT INTO public.profiles (id, role, is_active)
  VALUES (
    NEW.id,
    CASE WHEN is_first_user THEN 'admin'::public.user_role_enum ELSE 'member'::public.user_role_enum END,
    CASE WHEN is_first_user THEN true ELSE false END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user ();


-- 3. Final security hardening
-- Security hardening for existing installations.
-- Run after docs/schema.sql and the existing feature migrations.
-- This migration is idempotent and keeps pending users out of all data.

ALTER TABLE public.profiles
ALTER COLUMN is_active
SET DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.is_admin () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.is_active_user () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.is_editor () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'editor' AND is_active = true);
$$;

REVOKE ALL ON FUNCTION public.is_admin ()
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.is_active_user ()
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.is_editor ()
FROM
  PUBLIC;

GRANT
EXECUTE ON FUNCTION public.is_admin () TO authenticated;

GRANT
EXECUTE ON FUNCTION public.is_active_user () TO authenticated;

GRANT
EXECUTE ON FUNCTION public.is_editor () TO authenticated;

-- Harden SECURITY DEFINER admin RPCs as well; RLS does not protect tables
-- accessed from a SECURITY DEFINER function unless the function checks the
-- caller explicitly.
CREATE OR REPLACE FUNCTION public.get_admin_users () RETURNS SETOF public.admin_user_data LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied.'; END IF;
  RETURN QUERY SELECT au.id, au.email::text, p.role, au.created_at, p.is_active
    FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id
    ORDER BY au.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role (target_user_id uuid, new_role text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied.'; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot change your own role.'; END IF;
  IF new_role::public.user_role_enum <> 'admin'::public.user_role_enum
     AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
     AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1
  THEN RAISE EXCEPTION 'Cannot remove the last active administrator.'; END IF;
  UPDATE public.profiles SET role = new_role::public.user_role_enum WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user (target_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied.'; END IF;
  IF auth.uid() = target_user_id THEN RAISE EXCEPTION 'Cannot delete yourself.'; END IF;
  IF (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
     AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1
  THEN RAISE EXCEPTION 'Cannot delete the last active administrator.'; END IF;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_user (new_email text, new_password text, new_role text, new_active boolean) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth,
  extensions AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied.'; END IF;
  IF length(trim(new_email)) < 3 OR position('@' IN new_email) < 2
  THEN RAISE EXCEPTION 'Invalid email.'; END IF;
  IF length(new_password) < 8 THEN RAISE EXCEPTION 'Password must be at least 8 characters.'; END IF;
  new_id := gen_random_uuid();
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, reauthentication_token, email_change,
    phone_change, phone_change_token, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    trim(new_email), extensions.crypt(new_password, extensions.gen_salt('bf')), now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );
  INSERT INTO public.profiles (id, role, is_active, created_at, updated_at)
  VALUES (new_id, new_role::public.user_role_enum, new_active, now(), now())
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_active_status (target_user_id uuid, new_status boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied.'; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot change your own active status.'; END IF;
  IF new_status = false
     AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
     AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1
  THEN RAISE EXCEPTION 'Cannot deactivate the last active administrator.'; END IF;
  UPDATE public.profiles SET is_active = new_status WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users ()
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.set_user_role (uuid, text)
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.delete_user (uuid)
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.admin_create_user (text, text, text, boolean)
FROM
  PUBLIC;

REVOKE ALL ON FUNCTION public.set_user_active_status (uuid, boolean)
FROM
  PUBLIC;

GRANT
EXECUTE ON FUNCTION public.get_admin_users () TO authenticated;

GRANT
EXECUTE ON FUNCTION public.set_user_role (uuid, text) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.delete_user (uuid) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.admin_create_user (text, text, text, boolean) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.set_user_active_status (uuid, boolean) TO authenticated;

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.person_details_private ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;

DROP POLICY IF EXISTS "Active users can view persons" ON public.persons;

CREATE POLICY "Active users can view persons" ON public.persons FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Admins can manage persons" ON public.persons;

DROP POLICY IF EXISTS "Admins can insert persons" ON public.persons;

DROP POLICY IF EXISTS "Admins can update persons" ON public.persons;

DROP POLICY IF EXISTS "Admins can delete persons" ON public.persons;

DROP POLICY IF EXISTS "Admins and Editors can insert persons" ON public.persons;

DROP POLICY IF EXISTS "Admins and Editors can update persons" ON public.persons;

DROP POLICY IF EXISTS "Admins and Editors can delete persons" ON public.persons;

CREATE POLICY "Admins and Editors can insert persons" ON public.persons FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

CREATE POLICY "Admins and Editors can update persons" ON public.persons
FOR UPDATE
  TO authenticated USING (
    public.is_admin ()
    OR public.is_editor ()
  )
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

CREATE POLICY "Admins and Editors can delete persons" ON public.persons FOR DELETE TO authenticated USING (
  public.is_admin ()
  OR public.is_editor ()
);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;

DROP POLICY IF EXISTS "Active users can view relationships" ON public.relationships;

CREATE POLICY "Active users can view relationships" ON public.relationships FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Admins can manage relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins can insert relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins can update relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins can delete relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins and Editors can insert relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins and Editors can update relationships" ON public.relationships;

DROP POLICY IF EXISTS "Admins and Editors can delete relationships" ON public.relationships;

CREATE POLICY "Admins and Editors can insert relationships" ON public.relationships FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

CREATE POLICY "Admins and Editors can update relationships" ON public.relationships
FOR UPDATE
  TO authenticated USING (
    public.is_admin ()
    OR public.is_editor ()
  )
WITH
  CHECK (
    public.is_admin ()
    OR public.is_editor ()
  );

CREATE POLICY "Admins and Editors can delete relationships" ON public.relationships FOR DELETE TO authenticated USING (
  public.is_admin ()
  OR public.is_editor ()
);

DROP POLICY IF EXISTS "Admins can view private details" ON public.person_details_private;

DROP POLICY IF EXISTS "Admins can manage private details" ON public.person_details_private;

CREATE POLICY "Admins can view private details" ON public.person_details_private FOR
SELECT
  TO authenticated USING (public.is_admin ());

CREATE POLICY "Admins can manage private details" ON public.person_details_private FOR ALL TO authenticated USING (public.is_admin ())
WITH
  CHECK (public.is_admin ());

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can view custom events" ON public.custom_events;

CREATE POLICY "Active users can view custom events" ON public.custom_events FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Authenticated users can insert custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can insert custom events" ON public.custom_events;

CREATE POLICY "Active users can insert custom events" ON public.custom_events FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_active_user ()
    AND auth.uid () = created_by
  );

DROP POLICY IF EXISTS "Users can update own custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can update own custom events" ON public.custom_events;

CREATE POLICY "Active users can update own custom events" ON public.custom_events
FOR UPDATE
  TO authenticated USING (
    public.is_active_user ()
    AND (
      auth.uid () = created_by
      OR public.is_admin ()
    )
  )
WITH
  CHECK (
    public.is_active_user ()
    AND (
      auth.uid () = created_by
      OR public.is_admin ()
    )
  );

DROP POLICY IF EXISTS "Users can delete own custom events" ON public.custom_events;

DROP POLICY IF EXISTS "Active users can delete own custom events" ON public.custom_events;

CREATE POLICY "Active users can delete own custom events" ON public.custom_events FOR DELETE TO authenticated USING (
  public.is_active_user ()
  AND (
    auth.uid () = created_by
    OR public.is_admin ()
  )
);

-- Serialize bootstrap so concurrent signups cannot create two administrators.
CREATE OR REPLACE FUNCTION public.handle_new_user () RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = public,
  auth AS $$
DECLARE is_first_user boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  SELECT NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) INTO is_first_user;
  INSERT INTO public.profiles (id, role, is_active)
  VALUES (NEW.id,
    CASE WHEN is_first_user THEN 'admin'::public.user_role_enum ELSE 'member'::public.user_role_enum END,
    is_first_user);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_first_user_confirmation () RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = auth AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('giapha_os_first_user'));
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id <> NEW.id) THEN
    NEW.email_confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Private avatar bucket with a strict image allow-list and 2 MB limit.
INSERT INTO
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    FALSE,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = FALSE,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[];

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;

DROP POLICY IF EXISTS "Active users can view avatars" ON storage.objects;

CREATE POLICY "Active users can view avatars" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'avatars'
    AND public.is_active_user ()
  );

DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;

DROP POLICY IF EXISTS "Admins and editors can upload avatars" ON storage.objects;

CREATE POLICY "Admins and editors can upload avatars" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'avatars'
    AND (
      public.is_admin ()
      OR public.is_editor ()
    )
  );

DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;

DROP POLICY IF EXISTS "Admins and editors can update avatars" ON storage.objects;

CREATE POLICY "Admins and editors can update avatars" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'avatars'
    AND (
      public.is_admin ()
      OR public.is_editor ()
    )
  )
WITH
  CHECK (
    bucket_id = 'avatars'
    AND (
      public.is_admin ()
      OR public.is_editor ()
    )
  );

DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;

DROP POLICY IF EXISTS "Admins and editors can delete avatars" ON storage.objects;

CREATE POLICY "Admins and editors can delete avatars" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'avatars'
  AND (
    public.is_admin ()
    OR public.is_editor ()
  )
);

-- Existing gallery deployments must also lose public access and open writes.
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can view gallery" ON public.gallery_items;

CREATE POLICY "Active users can view gallery" ON public.gallery_items FOR
SELECT
  TO authenticated USING (public.is_active_user ());

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can insert gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;

CREATE POLICY "Admins can insert gallery" ON public.gallery_items FOR INSERT TO authenticated
WITH
  CHECK (
    public.is_admin ()
    AND auth.uid () = created_by
  );

DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can update gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;

CREATE POLICY "Admins can update gallery" ON public.gallery_items
FOR UPDATE
  TO authenticated USING (public.is_admin ())
WITH
  CHECK (public.is_admin ());

DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;

DROP POLICY IF EXISTS "Active users can delete gallery" ON public.gallery_items;

DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;

CREATE POLICY "Admins can delete gallery" ON public.gallery_items FOR DELETE TO authenticated USING (public.is_admin ());

INSERT INTO
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'gallery',
    'gallery',
    FALSE,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::TEXT[];

DROP POLICY IF EXISTS "Public Access" ON storage.objects;

DROP POLICY IF EXISTS "Active users can view gallery files" ON storage.objects;

CREATE POLICY "Active users can view gallery files" ON storage.objects FOR
SELECT
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_active_user ()
  );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

DROP POLICY IF EXISTS "Active users can upload gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can upload gallery files" ON storage.objects;

CREATE POLICY "Admins can upload gallery files" ON storage.objects FOR INSERT TO authenticated
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;

DROP POLICY IF EXISTS "Active users can update gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can update gallery files" ON storage.objects;

CREATE POLICY "Admins can update gallery files" ON storage.objects
FOR UPDATE
  TO authenticated USING (
    bucket_id = 'gallery'
    AND public.is_admin ()
  )
WITH
  CHECK (
    bucket_id = 'gallery'
    AND public.is_admin ()
  );

DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;

DROP POLICY IF EXISTS "Active users can delete gallery files" ON storage.objects;

DROP POLICY IF EXISTS "Admins can delete gallery files" ON storage.objects;

CREATE POLICY "Admins can delete gallery files" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'gallery'
  AND public.is_admin ()
);



-- docs/migrations/20260901000000_security_definer_and_rls_hardening.sql
-- Remove exposed SECURITY DEFINER entry points and make intentionally empty
-- RLS tables explicit deny-by-default. Run after all existing migrations.

-- Functions used by policies and triggers belong in a non-exposed schema. The
-- admin RPC names remain in public as SECURITY INVOKER compatibility wrappers;
-- the wrappers delegate to the private SECURITY DEFINER implementations after
-- the caller has entered through an authenticated session.
CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Re-running the setup bundle recreates the public functions (schema.sql), so
-- a private copy left by an earlier run is dropped before the public one moves.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.handle_updated_at()')
  ) THEN
    DROP FUNCTION IF EXISTS private.handle_updated_at();
    ALTER FUNCTION public.handle_updated_at() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.is_admin()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.is_admin();
    ALTER FUNCTION public.is_admin() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.is_active_user()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.is_active_user();
    ALTER FUNCTION public.is_active_user() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.is_editor()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.is_editor();
    ALTER FUNCTION public.is_editor() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.handle_new_user()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.handle_new_user();
    ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.handle_first_user_confirmation()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.handle_first_user_confirmation();
    ALTER FUNCTION public.handle_first_user_confirmation() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.get_admin_users()')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.get_admin_users();
    ALTER FUNCTION public.get_admin_users() SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.set_user_role(uuid,text)')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.set_user_role(uuid, text);
    ALTER FUNCTION public.set_user_role(uuid, text) SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.delete_user(uuid)')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.delete_user(uuid);
    ALTER FUNCTION public.delete_user(uuid) SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.admin_create_user(text,text,text,boolean)')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.admin_create_user(text, text, text, boolean);
    ALTER FUNCTION public.admin_create_user(text, text, text, boolean) SET SCHEMA private;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.oid = to_regprocedure('public.set_user_active_status(uuid,boolean)')
      AND p.prosecdef
  ) THEN
    DROP FUNCTION IF EXISTS private.set_user_active_status(uuid, boolean);
    ALTER FUNCTION public.set_user_active_status(uuid, boolean) SET SCHEMA private;
  END IF;
END;
$$;

-- Make every private SECURITY DEFINER function use an explicit path. Existing
-- function bodies already qualify application objects and trusted extensions.
ALTER FUNCTION private.handle_updated_at() SET search_path = public;
ALTER FUNCTION private.is_admin() SET search_path = '';
ALTER FUNCTION private.is_active_user() SET search_path = '';
ALTER FUNCTION private.is_editor() SET search_path = '';
ALTER FUNCTION private.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION private.handle_first_user_confirmation() SET search_path = auth;
ALTER FUNCTION private.get_admin_users() SET search_path = public, auth;
ALTER FUNCTION private.set_user_role(uuid, text) SET search_path = public, auth;
ALTER FUNCTION private.delete_user(uuid) SET search_path = public, auth;
ALTER FUNCTION private.admin_create_user(text, text, text, boolean) SET search_path = public, auth, extensions;
ALTER FUNCTION private.set_user_active_status(uuid, boolean) SET search_path = public, auth;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_active_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_editor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_editor() TO authenticated;

-- Keep policy and function-body references stable while removing the
-- SECURITY DEFINER attribute from the public API entry points.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_admin(); $$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_active_user(); $$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_editor(); $$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_editor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;

REVOKE ALL ON FUNCTION private.get_admin_users() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.set_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.delete_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.admin_create_user(text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.set_user_active_status(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION private.set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.admin_create_user(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION private.set_user_active_status(uuid, boolean) TO authenticated;

-- These wrappers are invoker functions, so the private implementation still
-- enforces the active-admin check while PostgREST exposes no SECURITY DEFINER
-- function in the public API schema.
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS SETOF public.admin_user_data
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT * FROM private.get_admin_users(); $$;

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.set_user_role(target_user_id, new_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.delete_user(target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_user(new_email text, new_password text, new_role text, new_active boolean)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.admin_create_user(new_email, new_password, new_role, new_active); $$;

CREATE OR REPLACE FUNCTION public.set_user_active_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.set_user_active_status(target_user_id, new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_create_user(text, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_user_active_status(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_active_status(uuid, boolean) TO authenticated;

-- Make the intentional server-only tables explicit deny-by-default instead of
-- relying only on RLS's implicit behavior. This also documents why no client
-- policy grants access to these tables.
DO $$
BEGIN
  IF to_regclass('public.user_approval_requests') IS NOT NULL THEN
    DROP POLICY IF EXISTS "No client access to approval requests" ON public.user_approval_requests;
    CREATE POLICY "No client access to approval requests"
      ON public.user_approval_requests
      FOR ALL TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;

  IF to_regclass('public.app_migrations') IS NOT NULL THEN
    DROP POLICY IF EXISTS "No client access to app migrations" ON public.app_migrations;
    CREATE POLICY "No client access to app migrations"
      ON public.app_migrations
      FOR ALL TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END;
$$;


-- docs/migrations/20260904000000_add_data_api_table_grants.sql
-- Explicit Data API grants. Supabase projects created after 2026-05-30 no
-- longer auto-grant table privileges in the public schema to anon,
-- authenticated, and service_role, so every PostgREST call fails with
-- 42501 "permission denied" even though the RLS policies are in place.
-- The matrix mirrors the policies: anon gets nothing (the app is login-only
-- and every policy is TO authenticated), authenticated gets the operations
-- a policy allows, service_role gets ALL for the server-side approval and
-- notification flows (BYPASSRLS does not replace GRANT). Future migrations
-- that create a table in public must add its grants here as well.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    REVOKE ALL ON public.profiles FROM anon;
    -- Profiles are written only by the signup trigger and admin RPCs, so
    -- clients only ever need to read them.
    GRANT SELECT ON public.profiles TO authenticated;
    GRANT ALL ON public.profiles TO service_role;
  END IF;

  IF to_regclass('public.persons') IS NOT NULL THEN
    REVOKE ALL ON public.persons FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.persons TO authenticated;
    GRANT ALL ON public.persons TO service_role;
  END IF;

  IF to_regclass('public.person_details_private') IS NOT NULL THEN
    REVOKE ALL ON public.person_details_private FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_details_private TO authenticated;
    GRANT ALL ON public.person_details_private TO service_role;
  END IF;

  IF to_regclass('public.relationships') IS NOT NULL THEN
    REVOKE ALL ON public.relationships FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationships TO authenticated;
    GRANT ALL ON public.relationships TO service_role;
  END IF;

  IF to_regclass('public.custom_events') IS NOT NULL THEN
    REVOKE ALL ON public.custom_events FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_events TO authenticated;
    GRANT ALL ON public.custom_events TO service_role;
  END IF;

  IF to_regclass('public.gallery_items') IS NOT NULL THEN
    REVOKE ALL ON public.gallery_items FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
    GRANT ALL ON public.gallery_items TO service_role;
  END IF;

  -- Server-only table: the deny-by-default RLS policy keeps clients out, but
  -- the one-time approval links read and claim rows through service_role.
  IF to_regclass('public.user_approval_requests') IS NOT NULL THEN
    REVOKE ALL ON public.user_approval_requests FROM anon, authenticated;
    GRANT ALL ON public.user_approval_requests TO service_role;
  END IF;
END;
$$;


-- docs/migrations/20261026000000_add_restore_backup.sql
-- Restore a backup (Dashboard → Data → Restore) in a single transaction.
-- Before this function the app deleted every member, relationship, private
-- detail and custom event, then inserted the backup in chunks of 200 rows:
-- a failed chunk left the family tree half deleted. Now the delete and all
-- inserts run inside one function call, so any error rolls everything back
-- and the current data stays as it was.
--
-- Payload (built by the app, see utils/backupPayload.ts):
--   {
--     "version": 1,
--     "counts": { "persons": n, "relationships": n,
--                 "person_details_private": n, "custom_events": n },
--     "persons": [...], "relationships": [...],
--     "person_details_private": [...], "custom_events": [...]
--   }
-- Returns the number of rows inserted per table, as a JSON object shaped
-- like "counts".
--
-- Same layout as the admin RPCs: the SECURITY DEFINER implementation lives in
-- the non-exposed private schema and checks private.is_admin(); the public
-- name is a SECURITY INVOKER wrapper for the Data API.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported restore payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid restore payload: the backup has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Children first, because of the foreign keys. WHERE true keeps
  -- safeupdate-style "DELETE needs a WHERE clause" guards happy.
  DELETE FROM public.custom_events WHERE true;
  DELETE FROM public.relationships WHERE true;
  DELETE FROM public.person_details_private WHERE true;
  DELETE FROM public.persons WHERE true;

  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  INSERT INTO public.relationships (type, person_a, person_b, note)
  SELECT r.type, r.person_a, r.person_b, r.note
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  -- created_by is the admin who restores, as with a manual insert.
  INSERT INTO public.custom_events (
    id, name, content, event_date, location, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location, auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Restore of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.restore_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.restore_backup(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.restore_backup(payload); $$;

REVOKE ALL ON FUNCTION public.restore_backup(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_backup(jsonb) TO authenticated;

-- Let PostgREST see the new function right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261026120000_add_update_generations.sql
-- Update the generation (and, for the lineage tool, birth order and in-law
-- flag) of many members in a single statement and transaction.
-- Before this function the app sent one UPDATE per member: a large family
-- needed hundreds of round-trips, and an error halfway left some members on
-- the new generations and the rest on the old ones. Now either every listed
-- member is updated or none is.
--
-- Payload (built by the app, see utils/generationUpdates.ts): a JSON array,
--   [{ "id": "<uuid>", "generation": 3, "birth_order": 1, "is_in_law": false }]
-- "id" is required; a column is only changed when its key is present, so
-- [{ "id": "...", "generation": 4 }] leaves birth_order and is_in_law alone.
-- Returns the number of members updated.
--
-- SECURITY INVOKER on purpose: the UPDATE runs with the caller's rights, so
-- the persons RLS policies (admins and editors only) still apply. A row the
-- caller may not update, or an id that no longer exists, is reported as an
-- error and rolls the whole call back.

CREATE OR REPLACE FUNCTION public.update_generations(updates jsonb)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  expected integer;
  actual integer;
BEGIN
  IF updates IS NULL OR jsonb_typeof(updates) <> 'array' THEN
    RAISE EXCEPTION 'Invalid generation updates: expected a JSON array.'
      USING ERRCODE = '22023';
  END IF;

  expected := jsonb_array_length(updates);
  IF expected = 0 THEN
    RETURN 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(updates) AS e(item)
    WHERE jsonb_typeof(e.item) IS DISTINCT FROM 'object'
       OR jsonb_typeof(e.item->'id') IS DISTINCT FROM 'string'
  ) THEN
    RAISE EXCEPTION 'Invalid generation updates: every row needs an "id".'
      USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(DISTINCT e.item->>'id')
    FROM jsonb_array_elements(updates) AS e(item)
  ) <> expected THEN
    RAISE EXCEPTION 'Invalid generation updates: a member is listed twice.'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.persons AS p
  SET
    generation = CASE WHEN u.item ? 'generation'
      THEN (u.item->>'generation')::integer ELSE p.generation END,
    birth_order = CASE WHEN u.item ? 'birth_order'
      THEN (u.item->>'birth_order')::integer ELSE p.birth_order END,
    is_in_law = CASE WHEN u.item ? 'is_in_law'
      THEN (u.item->>'is_in_law')::boolean ELSE p.is_in_law END
  FROM (
    SELECT (e.item->>'id')::uuid AS id, e.item
    FROM jsonb_array_elements(updates) AS e(item)
  ) AS u
  WHERE p.id = u.id;
  GET DIAGNOSTICS actual = ROW_COUNT;

  IF actual <> expected THEN
    RAISE EXCEPTION 'Updated % of % members: some were deleted meanwhile or you may not edit them. Nothing was changed.',
      actual, expected
      USING ERRCODE = 'P0002';
  END IF;

  RETURN actual;
END;
$$;

REVOKE ALL ON FUNCTION public.update_generations(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_generations(jsonb) TO authenticated;

-- Let PostgREST see the new function right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261027120000_add_merge_persons.sql
-- Merge two possibly-duplicate members into one (Dashboard → Backup &
-- restore → "People that may be duplicates" → Merge), in a single
-- transaction. Before this function the only way to clean up a duplicate was
-- to delete one profile by hand and re-create every relationship, private
-- detail and date on the other one.
--
-- Everything of the dropped member moves to the kept one:
--   * relationships are re-pointed; ones the kept member already has (same
--     type and same counterpart, a marriage either way round) and the
--     relationship between the two members themselves are removed,
--   * private details fill the kept member's empty fields (kept values win),
--   * empty columns of the kept member take the dropped member's values
--     (dates, birth order, generation, avatar), deceased/in-law flags OR,
--     different names are added to other_names, notes are appended,
--   * the dropped member is deleted; nothing else references it.
-- custom_events and gallery_items are per-user tables, not per-person, so
-- there is nothing to move for them. Only the avatar reference merges here;
-- when the kept member already had a different photo, the app removes the
-- dropped member's file from the avatars bucket after this function commits
-- (app/actions/mergePersons.ts, utils/mergeAvatarCleanup.ts).
--
-- There is no undo: the confirmation in the app asks for a backup first.
-- Returns a JSON summary:
--   { "relationships_moved": n, "relationships_dropped": n,
--     "details_fields_filled": n, "person_fields_filled": n }
--
-- Same layout as the other admin RPCs: the SECURITY DEFINER implementation
-- lives in the non-exposed private schema and checks private.is_admin(); the
-- public name is a SECURITY INVOKER wrapper for the Data API.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.merge_persons(keep_id uuid, drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  keep_row public.persons%ROWTYPE;
  drop_row public.persons%ROWTYPE;
  keep_private public.person_details_private%ROWTYPE;
  drop_private public.person_details_private%ROWTYPE;
  dropped_pair integer;
  dropped_duplicate integer;
  moved integer;
  person_fields integer := 0;
  details_fields integer := 0;
  new_other_names text;
  new_note text;
  names_added text[];
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF keep_id IS NULL OR drop_id IS NULL OR keep_id = drop_id THEN
    RAISE EXCEPTION 'Merge needs two different members.'
      USING ERRCODE = '22023';
  END IF;

  -- Lock both rows so a concurrent edit cannot land in the middle.
  SELECT * INTO keep_row FROM public.persons WHERE id = keep_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to keep no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO drop_row FROM public.persons WHERE id = drop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to merge no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 1. The relationship between the two members goes away: after the merge
  --    it would be a self-relationship.
  DELETE FROM public.relationships r
  WHERE (r.person_a = keep_id AND r.person_b = drop_id)
     OR (r.person_a = drop_id AND r.person_b = keep_id);
  GET DIAGNOSTICS dropped_pair = ROW_COUNT;

  -- 2. Relationships of the dropped member that the kept member already has
  --    are removed instead of moved. UNIQUE(person_a, person_b, type) is an
  --    ordered pair, so a marriage also matches the other way round.
  DELETE FROM public.relationships r
  WHERE (r.person_a = drop_id OR r.person_b = drop_id)
    AND EXISTS (
      SELECT 1
      FROM public.relationships k
      WHERE k.type = r.type
        AND (
          (k.person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END
           AND k.person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END)
          OR (r.type = 'marriage'
              AND k.person_a = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
              AND k.person_b = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END)
        )
    );
  GET DIAGNOSTICS dropped_duplicate = ROW_COUNT;

  -- 3. The remaining relationships of the dropped member are re-pointed to
  --    the kept member.
  UPDATE public.relationships r
  SET person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END,
      person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
  WHERE r.person_a = drop_id OR r.person_b = drop_id;
  GET DIAGNOSTICS moved = ROW_COUNT;

  -- 4. Private details: the kept member's values win, its empty fields take
  --    the dropped member's. A member without a row simply takes the other's.
  SELECT * INTO keep_private FROM public.person_details_private
  WHERE person_id = keep_id;
  SELECT * INTO drop_private FROM public.person_details_private
  WHERE person_id = drop_id;
  IF FOUND THEN
    IF keep_private.person_id IS NULL THEN
      UPDATE public.person_details_private
      SET person_id = keep_id, updated_at = now()
      WHERE person_id = drop_id;
    ELSE
      details_fields :=
        (CASE WHEN COALESCE(keep_private.phone_number, '') = ''
              AND COALESCE(drop_private.phone_number, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.occupation, '') = ''
              AND COALESCE(drop_private.occupation, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.current_residence, '') = ''
              AND COALESCE(drop_private.current_residence, '') <> '' THEN 1 ELSE 0 END);
      UPDATE public.person_details_private d
      SET phone_number = COALESCE(NULLIF(d.phone_number, ''), drop_private.phone_number),
          occupation = COALESCE(NULLIF(d.occupation, ''), drop_private.occupation),
          current_residence = COALESCE(NULLIF(d.current_residence, ''), drop_private.current_residence),
          updated_at = now()
      WHERE d.person_id = keep_id;
    END IF;
  END IF;

  -- 5. Empty columns of the kept member take the dropped member's values;
  --    a name that differs is remembered in other_names, notes are appended.
  names_added := ARRAY[]::text[];
  IF lower(drop_row.full_name) <> lower(keep_row.full_name) THEN
    names_added := names_added || drop_row.full_name;
  END IF;
  IF COALESCE(drop_row.other_names, '') <> '' THEN
    names_added := names_added ||
      ARRAY(SELECT trim(n)
            FROM unnest(string_to_array(drop_row.other_names, ',')) AS n
            WHERE COALESCE(trim(n), '') <> '');
  END IF;
  names_added := ARRAY(
    SELECT DISTINCT trim(n)
    FROM unnest(names_added) AS n
    WHERE COALESCE(trim(n), '') <> ''
      AND lower(trim(n)) <> lower(keep_row.full_name)
  );
  new_other_names := NULLIF(
    trim(
      BOTH ', ' FROM
      (SELECT string_agg(names.distinct_name, ', ')
       FROM (
         SELECT DISTINCT trim(x) AS distinct_name
         FROM unnest(
           string_to_array(COALESCE(keep_row.other_names, ''), ',') || names_added
         ) AS x
         WHERE COALESCE(trim(x), '') <> ''
       ) AS names
      )
    ), ''
  );
  IF new_other_names IS DISTINCT FROM keep_row.other_names THEN
    person_fields := person_fields + 1;
  END IF;

  new_note := CASE
    WHEN COALESCE(keep_row.note, '') = '' THEN NULLIF(drop_row.note, '')
    WHEN COALESCE(drop_row.note, '') = '' THEN keep_row.note
    ELSE keep_row.note || E'\n' || drop_row.note
  END;
  IF new_note IS DISTINCT FROM keep_row.note THEN
    person_fields := person_fields + 1;
  END IF;

  person_fields := person_fields
    + (CASE WHEN keep_row.birth_year IS NULL AND drop_row.birth_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_month IS NULL AND drop_row.birth_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_day IS NULL AND drop_row.birth_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_year IS NULL AND drop_row.death_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_month IS NULL AND drop_row.death_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_day IS NULL AND drop_row.death_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_year IS NULL AND drop_row.death_lunar_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_month IS NULL AND drop_row.death_lunar_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_day IS NULL AND drop_row.death_lunar_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_order IS NULL AND drop_row.birth_order IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.generation IS NULL AND drop_row.generation IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.avatar_url IS NULL AND drop_row.avatar_url IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_deceased AND drop_row.is_deceased THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_in_law AND drop_row.is_in_law THEN 1 ELSE 0 END);

  UPDATE public.persons p
  SET birth_year = COALESCE(p.birth_year, drop_row.birth_year),
      birth_month = COALESCE(p.birth_month, drop_row.birth_month),
      birth_day = COALESCE(p.birth_day, drop_row.birth_day),
      death_year = COALESCE(p.death_year, drop_row.death_year),
      death_month = COALESCE(p.death_month, drop_row.death_month),
      death_day = COALESCE(p.death_day, drop_row.death_day),
      death_lunar_year = COALESCE(p.death_lunar_year, drop_row.death_lunar_year),
      death_lunar_month = COALESCE(p.death_lunar_month, drop_row.death_lunar_month),
      death_lunar_day = COALESCE(p.death_lunar_day, drop_row.death_lunar_day),
      is_deceased = p.is_deceased OR drop_row.is_deceased,
      is_in_law = p.is_in_law OR drop_row.is_in_law,
      birth_order = COALESCE(p.birth_order, drop_row.birth_order),
      generation = COALESCE(p.generation, drop_row.generation),
      other_names = new_other_names,
      avatar_url = COALESCE(p.avatar_url, drop_row.avatar_url),
      note = new_note,
      updated_at = now()
  WHERE p.id = keep_id;

  -- 6. The dropped member leaves; CASCADE clears the rest of its rows.
  DELETE FROM public.persons WHERE id = drop_id;

  RETURN jsonb_build_object(
    'relationships_moved', moved,
    'relationships_dropped', dropped_pair + dropped_duplicate,
    'details_fields_filled', details_fields,
    'person_fields_filled', person_fields
  );
END;
$$;

REVOKE ALL ON FUNCTION private.merge_persons(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.merge_persons(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.merge_persons(keep_id uuid, drop_id uuid)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.merge_persons(keep_id, drop_id); $$;

REVOKE ALL ON FUNCTION public.merge_persons(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_persons(uuid, uuid) TO authenticated;

-- Let PostgREST see the new function right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261027180000_custom_events_recurrence.sql
-- Custom events that repeat every year (clan meeting, tomb sweeping, the
-- founder's anniversary...). Before this column a custom event only fell on
-- its stored date and had to be entered again every year.
--
--   recurrence = 'none'          once, on event_date (the default: existing
--                                events keep working as before)
--                'yearly_solar'  every year on the day/month of event_date
--                'yearly_lunar'  every year on the lunar day/month of
--                                event_date (leap month kept, like a giỗ)
--
-- Additive only: the column has a default, no row is changed, and an app
-- that does not know the column yet keeps working. restore_backup is
-- redefined so a restore keeps the recurrence of every event.

ALTER TABLE public.custom_events
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none'
  CONSTRAINT custom_events_recurrence_check
  CHECK (recurrence IN ('none', 'yearly_solar', 'yearly_lunar'));

CREATE OR REPLACE FUNCTION private.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported restore payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid restore payload: the backup has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Children first, because of the foreign keys. WHERE true keeps
  -- safeupdate-style "DELETE needs a WHERE clause" guards happy.
  DELETE FROM public.custom_events WHERE true;
  DELETE FROM public.relationships WHERE true;
  DELETE FROM public.person_details_private WHERE true;
  DELETE FROM public.persons WHERE true;

  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  INSERT INTO public.relationships (type, person_a, person_b, note)
  SELECT r.type, r.person_a, r.person_b, r.note
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  -- created_by is the admin who restores, as with a manual insert.
  -- A backup made before events could repeat has no recurrence: 'none'.
  INSERT INTO public.custom_events (
    id, name, content, event_date, location, recurrence, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location,
    COALESCE(NULLIF(e.recurrence, ''), 'none'), auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text,
    recurrence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Restore of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.restore_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.restore_backup(jsonb) TO authenticated;

-- Let PostgREST see the new column right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261028120000_add_burial_place.sql
-- Burial place of a member (nơi an táng): where the grave is, so the family
-- knows where to go for tomb sweeping. Before this column it could only be
-- written into the free-form note.
--
-- Public like the dates of death: every active member can read it (the RLS
-- of persons is unchanged), it is not a private detail.
--
-- Additive only: the column is nullable, no row is changed, and an app that
-- does not know the column yet keeps working. restore_backup and
-- merge_persons are redefined because both list the persons columns:
--   * a restore keeps the burial place (a backup without it restores null),
--   * a merge fills an empty burial place of the kept member from the
--     merged-away one and counts it in person_fields_filled.

ALTER TABLE public.persons
  ADD COLUMN IF NOT EXISTS burial_place text;

CREATE OR REPLACE FUNCTION private.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported restore payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid restore payload: the backup has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Children first, because of the foreign keys. WHERE true keeps
  -- safeupdate-style "DELETE needs a WHERE clause" guards happy.
  DELETE FROM public.custom_events WHERE true;
  DELETE FROM public.relationships WHERE true;
  DELETE FROM public.person_details_private WHERE true;
  DELETE FROM public.persons WHERE true;

  -- A backup made before burial places has no burial_place: null.
  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note, burial_place
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note, p.burial_place
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text, burial_place text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  INSERT INTO public.relationships (type, person_a, person_b, note)
  SELECT r.type, r.person_a, r.person_b, r.note
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  -- created_by is the admin who restores, as with a manual insert.
  -- A backup made before events could repeat has no recurrence: 'none'.
  INSERT INTO public.custom_events (
    id, name, content, event_date, location, recurrence, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location,
    COALESCE(NULLIF(e.recurrence, ''), 'none'), auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text,
    recurrence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Restore of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.restore_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.restore_backup(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.merge_persons(keep_id uuid, drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  keep_row public.persons%ROWTYPE;
  drop_row public.persons%ROWTYPE;
  keep_private public.person_details_private%ROWTYPE;
  drop_private public.person_details_private%ROWTYPE;
  dropped_pair integer;
  dropped_duplicate integer;
  moved integer;
  person_fields integer := 0;
  details_fields integer := 0;
  new_other_names text;
  new_note text;
  names_added text[];
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF keep_id IS NULL OR drop_id IS NULL OR keep_id = drop_id THEN
    RAISE EXCEPTION 'Merge needs two different members.'
      USING ERRCODE = '22023';
  END IF;

  -- Lock both rows so a concurrent edit cannot land in the middle.
  SELECT * INTO keep_row FROM public.persons WHERE id = keep_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to keep no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO drop_row FROM public.persons WHERE id = drop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to merge no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 1. The relationship between the two members goes away: after the merge
  --    it would be a self-relationship.
  DELETE FROM public.relationships r
  WHERE (r.person_a = keep_id AND r.person_b = drop_id)
     OR (r.person_a = drop_id AND r.person_b = keep_id);
  GET DIAGNOSTICS dropped_pair = ROW_COUNT;

  -- 2. Relationships of the dropped member that the kept member already has
  --    are removed instead of moved. UNIQUE(person_a, person_b, type) is an
  --    ordered pair, so a marriage also matches the other way round.
  DELETE FROM public.relationships r
  WHERE (r.person_a = drop_id OR r.person_b = drop_id)
    AND EXISTS (
      SELECT 1
      FROM public.relationships k
      WHERE k.type = r.type
        AND (
          (k.person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END
           AND k.person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END)
          OR (r.type = 'marriage'
              AND k.person_a = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
              AND k.person_b = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END)
        )
    );
  GET DIAGNOSTICS dropped_duplicate = ROW_COUNT;

  -- 3. The remaining relationships of the dropped member are re-pointed to
  --    the kept member.
  UPDATE public.relationships r
  SET person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END,
      person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
  WHERE r.person_a = drop_id OR r.person_b = drop_id;
  GET DIAGNOSTICS moved = ROW_COUNT;

  -- 4. Private details: the kept member's values win, its empty fields take
  --    the dropped member's. A member without a row simply takes the other's.
  SELECT * INTO keep_private FROM public.person_details_private
  WHERE person_id = keep_id;
  SELECT * INTO drop_private FROM public.person_details_private
  WHERE person_id = drop_id;
  IF FOUND THEN
    IF keep_private.person_id IS NULL THEN
      UPDATE public.person_details_private
      SET person_id = keep_id, updated_at = now()
      WHERE person_id = drop_id;
    ELSE
      details_fields :=
        (CASE WHEN COALESCE(keep_private.phone_number, '') = ''
              AND COALESCE(drop_private.phone_number, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.occupation, '') = ''
              AND COALESCE(drop_private.occupation, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.current_residence, '') = ''
              AND COALESCE(drop_private.current_residence, '') <> '' THEN 1 ELSE 0 END);
      UPDATE public.person_details_private d
      SET phone_number = COALESCE(NULLIF(d.phone_number, ''), drop_private.phone_number),
          occupation = COALESCE(NULLIF(d.occupation, ''), drop_private.occupation),
          current_residence = COALESCE(NULLIF(d.current_residence, ''), drop_private.current_residence),
          updated_at = now()
      WHERE d.person_id = keep_id;
    END IF;
  END IF;

  -- 5. Empty columns of the kept member (burial place included) take the
  --    dropped member's values;
  --    a name that differs is remembered in other_names, notes are appended.
  names_added := ARRAY[]::text[];
  IF lower(drop_row.full_name) <> lower(keep_row.full_name) THEN
    names_added := names_added || drop_row.full_name;
  END IF;
  IF COALESCE(drop_row.other_names, '') <> '' THEN
    names_added := names_added ||
      ARRAY(SELECT trim(n)
            FROM unnest(string_to_array(drop_row.other_names, ',')) AS n
            WHERE COALESCE(trim(n), '') <> '');
  END IF;
  names_added := ARRAY(
    SELECT DISTINCT trim(n)
    FROM unnest(names_added) AS n
    WHERE COALESCE(trim(n), '') <> ''
      AND lower(trim(n)) <> lower(keep_row.full_name)
  );
  new_other_names := NULLIF(
    trim(
      BOTH ', ' FROM
      (SELECT string_agg(names.distinct_name, ', ')
       FROM (
         SELECT DISTINCT trim(x) AS distinct_name
         FROM unnest(
           string_to_array(COALESCE(keep_row.other_names, ''), ',') || names_added
         ) AS x
         WHERE COALESCE(trim(x), '') <> ''
       ) AS names
      )
    ), ''
  );
  IF new_other_names IS DISTINCT FROM keep_row.other_names THEN
    person_fields := person_fields + 1;
  END IF;

  new_note := CASE
    WHEN COALESCE(keep_row.note, '') = '' THEN NULLIF(drop_row.note, '')
    WHEN COALESCE(drop_row.note, '') = '' THEN keep_row.note
    ELSE keep_row.note || E'\n' || drop_row.note
  END;
  IF new_note IS DISTINCT FROM keep_row.note THEN
    person_fields := person_fields + 1;
  END IF;

  person_fields := person_fields
    + (CASE WHEN keep_row.birth_year IS NULL AND drop_row.birth_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_month IS NULL AND drop_row.birth_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_day IS NULL AND drop_row.birth_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_year IS NULL AND drop_row.death_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_month IS NULL AND drop_row.death_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_day IS NULL AND drop_row.death_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_year IS NULL AND drop_row.death_lunar_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_month IS NULL AND drop_row.death_lunar_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_day IS NULL AND drop_row.death_lunar_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_order IS NULL AND drop_row.birth_order IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.generation IS NULL AND drop_row.generation IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.avatar_url IS NULL AND drop_row.avatar_url IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN COALESCE(keep_row.burial_place, '') = ''
            AND COALESCE(drop_row.burial_place, '') <> '' THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_deceased AND drop_row.is_deceased THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_in_law AND drop_row.is_in_law THEN 1 ELSE 0 END);

  UPDATE public.persons p
  SET birth_year = COALESCE(p.birth_year, drop_row.birth_year),
      birth_month = COALESCE(p.birth_month, drop_row.birth_month),
      birth_day = COALESCE(p.birth_day, drop_row.birth_day),
      death_year = COALESCE(p.death_year, drop_row.death_year),
      death_month = COALESCE(p.death_month, drop_row.death_month),
      death_day = COALESCE(p.death_day, drop_row.death_day),
      death_lunar_year = COALESCE(p.death_lunar_year, drop_row.death_lunar_year),
      death_lunar_month = COALESCE(p.death_lunar_month, drop_row.death_lunar_month),
      death_lunar_day = COALESCE(p.death_lunar_day, drop_row.death_lunar_day),
      is_deceased = p.is_deceased OR drop_row.is_deceased,
      is_in_law = p.is_in_law OR drop_row.is_in_law,
      birth_order = COALESCE(p.birth_order, drop_row.birth_order),
      generation = COALESCE(p.generation, drop_row.generation),
      other_names = new_other_names,
      avatar_url = COALESCE(p.avatar_url, drop_row.avatar_url),
      burial_place = COALESCE(NULLIF(p.burial_place, ''), NULLIF(drop_row.burial_place, '')),
      note = new_note,
      updated_at = now()
  WHERE p.id = keep_id;

  -- 6. The dropped member leaves; CASCADE clears the rest of its rows.
  DELETE FROM public.persons WHERE id = drop_id;

  RETURN jsonb_build_object(
    'relationships_moved', moved,
    'relationships_dropped', dropped_pair + dropped_duplicate,
    'details_fields_filled', details_fields,
    'person_fields_filled', person_fields
  );
END;
$$;

REVOKE ALL ON FUNCTION private.merge_persons(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.merge_persons(uuid, uuid) TO authenticated;

-- Let PostgREST see the new column right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261030120000_restore_relationship_created_at.sql
-- Keep the relationships' created_at on restore. The tree, mind map and
-- family book order a member's spouses by the spouse's birth year, then by
-- when the marriage was added; restoring every row with the same now() made
-- that order fall back to the new random ids.
--
-- Compatible: no table change; restore_backup is redefined to read an
-- optional created_at per relationship (older backups restore with now()).

CREATE OR REPLACE FUNCTION private.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported restore payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid restore payload: the backup has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Children first, because of the foreign keys. WHERE true keeps
  -- safeupdate-style "DELETE needs a WHERE clause" guards happy.
  DELETE FROM public.custom_events WHERE true;
  DELETE FROM public.relationships WHERE true;
  DELETE FROM public.person_details_private WHERE true;
  DELETE FROM public.persons WHERE true;

  -- A backup made before burial places has no burial_place: null.
  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note, burial_place
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note, p.burial_place
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text, burial_place text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  -- created_at comes from the backup (spouse order follows it); a backup
  -- without it gets the restore time.
  INSERT INTO public.relationships (type, person_a, person_b, note, created_at)
  SELECT r.type, r.person_a, r.person_b, r.note, COALESCE(r.created_at, now())
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text,
    created_at timestamptz
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  -- created_by is the admin who restores, as with a manual insert.
  -- A backup made before events could repeat has no recurrence: 'none'.
  INSERT INTO public.custom_events (
    id, name, content, event_date, location, recurrence, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location,
    COALESCE(NULLIF(e.recurrence, ''), 'none'), auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text,
    recurrence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Restore of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.restore_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.restore_backup(jsonb) TO authenticated;


-- docs/migrations/20261030180000_add_append_import.sql
-- Add a file to the current family tree (Dashboard → Data → Restore →
-- "Add to the current tree"), e.g. the branch a relative exported from their
-- own copy of the app or from Gramps/MyHeritage.
--
-- Unlike restore_backup this function only inserts: it never deletes or
-- updates a row, so the current members, relationships, private details and
-- events stay as they are. The app gives every member and event of the file a
-- new id before calling it (utils/appendImport.ts), so the file's rows can
-- not collide with existing ones; if one did, the primary key would refuse
-- it and the whole call would roll back.
--
-- Payload: the same shape as restore_backup (see utils/backupPayload.ts).
-- Returns the number of rows inserted per table.
--
-- Compatible: no table change, a new function only. Safe to run again.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.append_import(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid import payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported import payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid import payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid import payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid import payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid import payload: the file has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid import payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Plain INSERTs (no ON CONFLICT): an id that already exists fails the call
  -- instead of overwriting anything.
  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note, burial_place
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note, p.burial_place
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text, burial_place text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  INSERT INTO public.relationships (type, person_a, person_b, note, created_at)
  SELECT r.type, r.person_a, r.person_b, r.note, COALESCE(r.created_at, now())
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text,
    created_at timestamptz
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  INSERT INTO public.custom_events (
    id, name, content, event_date, location, recurrence, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location,
    COALESCE(NULLIF(e.recurrence, ''), 'none'), auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text,
    recurrence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Import of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.append_import(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.append_import(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.append_import(payload jsonb)
RETURNS jsonb
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.append_import(payload); $$;

REVOKE ALL ON FUNCTION public.append_import(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.append_import(jsonb) TO authenticated;

-- Let PostgREST see the new function right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261031120000_revoke_approval_link_on_lock.sql
-- Locking a user also revokes their open approval link. The link mailed to
-- the administrators stays valid for 7 days; without this, clicking it (or a
-- forwarded copy) after the user was locked in User management turned the
-- account back on.
--
-- Compatible: no table change; private.set_user_active_status is redefined to
-- close the user's unused approval request when the new status is inactive.
-- The approval route answers 410 for a used link whose account is inactive.
-- Unlocking works as before.

CREATE OR REPLACE FUNCTION private.set_user_active_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot change your own active status.';
    END IF;

    IF new_status = false
       AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
       AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1 THEN
        RAISE EXCEPTION 'Cannot deactivate the last active administrator.';
    END IF;

    UPDATE public.profiles
    SET is_active = new_status
    WHERE id = target_user_id;

    IF new_status = false THEN
        UPDATE public.user_approval_requests
        SET used_at = now()
        WHERE user_id = target_user_id
          AND used_at IS NULL;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.set_user_active_status(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.set_user_active_status(uuid, boolean) TO authenticated;


-- docs/migrations/20261031180000_lock_blocks_approval.sql
-- A locked account stays locked: it no longer asks for approval again, and
-- an approval link cannot turn it back on, even when the lock lands while
-- the administrator is on the approval page.
--
-- Before, "locked" and "waiting for approval" were the same state
-- (is_active = false), so a locked user who signed in again got a fresh
-- approval request and the administrators a new email. And the approval
-- link activated the account in two separate requests (read, then update),
-- so a lock that landed in between was undone.
--
-- Additive only, no data removed:
--   * profiles.locked_at (nullable): set when an administrator locks the
--     account, cleared when they unlock it. Filled for accounts already
--     locked with an approval link that was used or revoked (inactive with a
--     used request); other inactive accounts stay "waiting for approval".
--   * private.set_user_active_status is redefined to set/clear locked_at
--     (it still revokes the open approval link when locking).
--   * public.approve_user_request(token_hash): approves in one transaction,
--     callable by the server (service_role) only. It locks the profile row,
--     then the request row, in the same order as set_user_active_status, so
--     a lock and an approval running together wait for each other: an
--     approval that comes second sees the lock and leaves the account off.
-- Backup and restore do not include profiles and are unchanged.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

UPDATE public.profiles p
SET locked_at = r.used_at
FROM public.user_approval_requests r
WHERE r.user_id = p.id
  AND p.is_active = false
  AND p.locked_at IS NULL
  AND r.used_at IS NOT NULL;

CREATE OR REPLACE FUNCTION private.set_user_active_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot change your own active status.';
    END IF;

    IF new_status = false
       AND (SELECT role FROM public.profiles WHERE id = target_user_id) = 'admin'::public.user_role_enum
       AND (SELECT count(*) FROM public.profiles WHERE role = 'admin' AND is_active) <= 1 THEN
        RAISE EXCEPTION 'Cannot deactivate the last active administrator.';
    END IF;

    UPDATE public.profiles
    SET is_active = new_status,
        locked_at = CASE WHEN new_status THEN NULL ELSE COALESCE(locked_at, now()) END
    WHERE id = target_user_id;

    IF new_status = false THEN
        UPDATE public.user_approval_requests
        SET used_at = now()
        WHERE user_id = target_user_id
          AND used_at IS NULL;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION private.set_user_active_status(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.set_user_active_status(uuid, boolean) TO authenticated;

-- Returns {"status": ..., "email": ...}; status is one of
--   approved   the account is active now and the link is used
--   processed  the link was used before and the account is active
--   revoked    the account is locked (the link is closed, nothing activated)
--   expired    the link is past its expiry date
--   invalid    no request has this token
--   not_found  the request has no profile
CREATE OR REPLACE FUNCTION public.approve_user_request(p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_request_id uuid;
    v_user_id uuid;
    v_request public.user_approval_requests%ROWTYPE;
    v_profile public.profiles%ROWTYPE;
BEGIN
    SELECT r.id, r.user_id INTO v_request_id, v_user_id
    FROM public.user_approval_requests r
    WHERE r.token_hash = p_token_hash;

    IF v_request_id IS NULL THEN
        RETURN jsonb_build_object('status', 'invalid', 'email', NULL);
    END IF;

    -- Profile first, then request: the order set_user_active_status writes
    -- them in, so the two never deadlock and the later one sees the other's
    -- committed change.
    SELECT * INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_user_id
    FOR UPDATE;

    SELECT * INTO v_request
    FROM public.user_approval_requests r
    WHERE r.id = v_request_id
    FOR UPDATE;

    -- Deleted, or re-issued with a new token while we waited.
    IF v_request.id IS NULL OR v_request.token_hash <> p_token_hash THEN
        RETURN jsonb_build_object('status', 'invalid', 'email', NULL);
    END IF;

    IF v_request.used_at IS NOT NULL THEN
        IF v_profile.id IS NOT NULL AND NOT v_profile.is_active THEN
            RETURN jsonb_build_object('status', 'revoked', 'email', v_request.email);
        END IF;
        RETURN jsonb_build_object('status', 'processed', 'email', v_request.email);
    END IF;

    IF v_request.expires_at <= now() THEN
        RETURN jsonb_build_object('status', 'expired', 'email', v_request.email);
    END IF;

    IF v_profile.id IS NULL THEN
        RETURN jsonb_build_object('status', 'not_found', 'email', v_request.email);
    END IF;

    IF v_profile.locked_at IS NOT NULL THEN
        UPDATE public.user_approval_requests
        SET used_at = now()
        WHERE id = v_request.id;
        RETURN jsonb_build_object('status', 'revoked', 'email', v_request.email);
    END IF;

    UPDATE public.profiles
    SET is_active = true
    WHERE id = v_profile.id
      AND is_active = false;

    UPDATE public.user_approval_requests
    SET used_at = now()
    WHERE id = v_request.id;

    RETURN jsonb_build_object('status', 'approved', 'email', v_request.email);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_user_request(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_user_request(text) TO service_role;

-- Let PostgREST see the new function right away.
NOTIFY pgrst, 'reload schema';


-- docs/migrations/20261112120000_add_gallery_item_persons.sql
-- Tag family members in gallery photos. A photo can show any number of
-- members and a member can be in any number of photos; the member page lists
-- their photos and the gallery can be filtered by member.
--
-- Additive only: one new table. No existing table or row changes, and an app
-- that does not know the table keeps working (the gallery just shows no tags).
-- Safe to run more than once.
--
-- Deleting a photo or a member removes its tags (ON DELETE CASCADE).
-- Row-level security mirrors gallery_items: active members read, admins write.
--
-- restore_backup and merge_persons are redefined because both delete members:
--   * a restore keeps the tags of a backup that has them (a tag whose photo or
--     member is missing is skipped); a backup made before tags existed keeps
--     the tags that are in the database now for members that are restored,
--   * a merge moves the dropped member's tags to the kept member.

CREATE TABLE IF NOT EXISTS public.gallery_item_persons (
  gallery_item_id uuid NOT NULL REFERENCES public.gallery_items(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  PRIMARY KEY (gallery_item_id, person_id)
);

CREATE INDEX IF NOT EXISTS gallery_item_persons_person_id_idx
  ON public.gallery_item_persons (person_id);

ALTER TABLE public.gallery_item_persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active users can view gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Active users can view gallery tags"
ON public.gallery_item_persons FOR SELECT TO authenticated
USING (public.is_active_user());

DROP POLICY IF EXISTS "Admins can insert gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can insert gallery tags"
ON public.gallery_item_persons FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can update gallery tags"
ON public.gallery_item_persons FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete gallery tags" ON public.gallery_item_persons;
CREATE POLICY "Admins can delete gallery tags"
ON public.gallery_item_persons FOR DELETE TO authenticated
USING (public.is_admin());

REVOKE ALL ON public.gallery_item_persons FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_item_persons TO authenticated;
GRANT ALL ON public.gallery_item_persons TO service_role;

CREATE OR REPLACE FUNCTION private.restore_backup(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  section text;
  expected integer;
  actual integer;
  inserted jsonb := '{}'::jsonb;
  tags jsonb;
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: expected a JSON object.'
      USING ERRCODE = '22023';
  END IF;

  IF payload->'version' IS DISTINCT FROM '1'::jsonb THEN
    RAISE EXCEPTION 'Unsupported restore payload version: %. Update the app and run the pending migrations.',
      COALESCE(payload->>'version', 'missing')
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(payload->'counts') IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid restore payload: "counts" is missing.'
      USING ERRCODE = '22023';
  END IF;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    IF jsonb_typeof(payload->section) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" must be an array.', section
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(payload->'counts'->section) IS DISTINCT FROM 'number'
       OR (payload->'counts'->>section)::numeric
          <> jsonb_array_length(payload->section) THEN
      RAISE EXCEPTION 'Invalid restore payload: "%" has % rows, counts says %.',
        section, jsonb_array_length(payload->section),
        COALESCE(payload->'counts'->>section, 'missing')
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Same limits as the app (utils/backupPayload.ts).
  IF jsonb_array_length(payload->'persons') = 0 THEN
    RAISE EXCEPTION 'Invalid restore payload: the backup has no members.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(payload->'persons') > 10000
     OR jsonb_array_length(payload->'relationships') > 30000
     OR jsonb_array_length(payload->'person_details_private') > 10000
     OR jsonb_array_length(payload->'custom_events') > 10000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Photo tags are optional. A backup without them (made before tags existed)
  -- keeps the tags now in the database: deleting the members below would
  -- cascade them away, so they are read first and re-added for the members
  -- that are restored.
  IF payload->'gallery_item_persons' IS NULL
     OR jsonb_typeof(payload->'gallery_item_persons') = 'null' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'gallery_item_id', t.gallery_item_id, 'person_id', t.person_id
    )), '[]'::jsonb)
    INTO tags
    FROM public.gallery_item_persons t;
  ELSIF jsonb_typeof(payload->'gallery_item_persons') = 'array' THEN
    tags := payload->'gallery_item_persons';
  ELSE
    RAISE EXCEPTION 'Invalid restore payload: "gallery_item_persons" must be an array.'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(tags) > 100000 THEN
    RAISE EXCEPTION 'Invalid restore payload: too many rows.'
      USING ERRCODE = '22023';
  END IF;

  -- Children first, because of the foreign keys. WHERE true keeps
  -- safeupdate-style "DELETE needs a WHERE clause" guards happy.
  DELETE FROM public.custom_events WHERE true;
  DELETE FROM public.relationships WHERE true;
  DELETE FROM public.person_details_private WHERE true;
  DELETE FROM public.persons WHERE true;

  -- A backup made before burial places has no burial_place: null.
  INSERT INTO public.persons (
    id, full_name, gender,
    birth_year, birth_month, birth_day,
    death_year, death_month, death_day,
    death_lunar_year, death_lunar_month, death_lunar_day,
    is_deceased, is_in_law, birth_order, generation,
    other_names, avatar_url, note, burial_place
  )
  SELECT
    p.id, p.full_name, p.gender,
    p.birth_year, p.birth_month, p.birth_day,
    p.death_year, p.death_month, p.death_day,
    p.death_lunar_year, p.death_lunar_month, p.death_lunar_day,
    COALESCE(p.is_deceased, false), COALESCE(p.is_in_law, false),
    p.birth_order, p.generation,
    p.other_names, p.avatar_url, p.note, p.burial_place
  FROM jsonb_to_recordset(payload->'persons') AS p(
    id uuid, full_name text, gender public.gender_enum,
    birth_year integer, birth_month integer, birth_day integer,
    death_year integer, death_month integer, death_day integer,
    death_lunar_year integer, death_lunar_month integer, death_lunar_day integer,
    is_deceased boolean, is_in_law boolean, birth_order integer, generation integer,
    other_names text, avatar_url text, note text, burial_place text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('persons', actual);

  -- created_at comes from the backup (spouse order follows it); a backup
  -- without it gets the restore time.
  INSERT INTO public.relationships (type, person_a, person_b, note, created_at)
  SELECT r.type, r.person_a, r.person_b, r.note, COALESCE(r.created_at, now())
  FROM jsonb_to_recordset(payload->'relationships') AS r(
    type public.relationship_type_enum, person_a uuid, person_b uuid, note text,
    created_at timestamptz
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('relationships', actual);

  INSERT INTO public.person_details_private (
    person_id, phone_number, occupation, current_residence
  )
  SELECT d.person_id, d.phone_number, d.occupation, d.current_residence
  FROM jsonb_to_recordset(payload->'person_details_private') AS d(
    person_id uuid, phone_number text, occupation text, current_residence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('person_details_private', actual);

  -- created_by is the admin who restores, as with a manual insert.
  -- A backup made before events could repeat has no recurrence: 'none'.
  INSERT INTO public.custom_events (
    id, name, content, event_date, location, recurrence, created_by
  )
  SELECT e.id, e.name, e.content, e.event_date, e.location,
    COALESCE(NULLIF(e.recurrence, ''), 'none'), auth.uid()
  FROM jsonb_to_recordset(payload->'custom_events') AS e(
    id uuid, name text, content text, event_date date, location text,
    recurrence text
  );
  GET DIAGNOSTICS actual = ROW_COUNT;
  inserted := inserted || jsonb_build_object('custom_events', actual);

  -- A tag whose photo or member no longer exists is skipped, not an error;
  -- it is not part of the counts for the same reason.
  INSERT INTO public.gallery_item_persons (gallery_item_id, person_id)
  SELECT DISTINCT g.gallery_item_id, g.person_id
  FROM jsonb_to_recordset(tags) AS g(gallery_item_id uuid, person_id uuid)
  WHERE EXISTS (SELECT 1 FROM public.gallery_items i WHERE i.id = g.gallery_item_id)
    AND EXISTS (SELECT 1 FROM public.persons p WHERE p.id = g.person_id)
  ON CONFLICT DO NOTHING;

  FOREACH section IN ARRAY ARRAY[
    'persons', 'relationships', 'person_details_private', 'custom_events'
  ] LOOP
    expected := jsonb_array_length(payload->section);
    IF (inserted->>section)::integer <> expected THEN
      RAISE EXCEPTION 'Restore of "%" inserted % rows instead of %.',
        section, inserted->>section, expected;
    END IF;
  END LOOP;

  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION private.restore_backup(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.restore_backup(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION private.merge_persons(keep_id uuid, drop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  keep_row public.persons%ROWTYPE;
  drop_row public.persons%ROWTYPE;
  keep_private public.person_details_private%ROWTYPE;
  drop_private public.person_details_private%ROWTYPE;
  dropped_pair integer;
  dropped_duplicate integer;
  moved integer;
  person_fields integer := 0;
  details_fields integer := 0;
  new_other_names text;
  new_note text;
  names_added text[];
BEGIN
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Access denied.' USING ERRCODE = '42501';
  END IF;

  IF keep_id IS NULL OR drop_id IS NULL OR keep_id = drop_id THEN
    RAISE EXCEPTION 'Merge needs two different members.'
      USING ERRCODE = '22023';
  END IF;

  -- Lock both rows so a concurrent edit cannot land in the middle.
  SELECT * INTO keep_row FROM public.persons WHERE id = keep_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to keep no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO drop_row FROM public.persons WHERE id = drop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The member to merge no longer exists.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 1. The relationship between the two members goes away: after the merge
  --    it would be a self-relationship.
  DELETE FROM public.relationships r
  WHERE (r.person_a = keep_id AND r.person_b = drop_id)
     OR (r.person_a = drop_id AND r.person_b = keep_id);
  GET DIAGNOSTICS dropped_pair = ROW_COUNT;

  -- 2. Relationships of the dropped member that the kept member already has
  --    are removed instead of moved. UNIQUE(person_a, person_b, type) is an
  --    ordered pair, so a marriage also matches the other way round.
  DELETE FROM public.relationships r
  WHERE (r.person_a = drop_id OR r.person_b = drop_id)
    AND EXISTS (
      SELECT 1
      FROM public.relationships k
      WHERE k.type = r.type
        AND (
          (k.person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END
           AND k.person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END)
          OR (r.type = 'marriage'
              AND k.person_a = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
              AND k.person_b = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END)
        )
    );
  GET DIAGNOSTICS dropped_duplicate = ROW_COUNT;

  -- 3. The remaining relationships of the dropped member are re-pointed to
  --    the kept member.
  UPDATE public.relationships r
  SET person_a = CASE WHEN r.person_a = drop_id THEN keep_id ELSE r.person_a END,
      person_b = CASE WHEN r.person_b = drop_id THEN keep_id ELSE r.person_b END
  WHERE r.person_a = drop_id OR r.person_b = drop_id;
  GET DIAGNOSTICS moved = ROW_COUNT;

  -- 4. Private details: the kept member's values win, its empty fields take
  --    the dropped member's. A member without a row simply takes the other's.
  SELECT * INTO keep_private FROM public.person_details_private
  WHERE person_id = keep_id;
  SELECT * INTO drop_private FROM public.person_details_private
  WHERE person_id = drop_id;
  IF FOUND THEN
    IF keep_private.person_id IS NULL THEN
      UPDATE public.person_details_private
      SET person_id = keep_id, updated_at = now()
      WHERE person_id = drop_id;
    ELSE
      details_fields :=
        (CASE WHEN COALESCE(keep_private.phone_number, '') = ''
              AND COALESCE(drop_private.phone_number, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.occupation, '') = ''
              AND COALESCE(drop_private.occupation, '') <> '' THEN 1 ELSE 0 END)
        + (CASE WHEN COALESCE(keep_private.current_residence, '') = ''
              AND COALESCE(drop_private.current_residence, '') <> '' THEN 1 ELSE 0 END);
      UPDATE public.person_details_private d
      SET phone_number = COALESCE(NULLIF(d.phone_number, ''), drop_private.phone_number),
          occupation = COALESCE(NULLIF(d.occupation, ''), drop_private.occupation),
          current_residence = COALESCE(NULLIF(d.current_residence, ''), drop_private.current_residence),
          updated_at = now()
      WHERE d.person_id = keep_id;
    END IF;
  END IF;

  -- 5. Empty columns of the kept member (burial place included) take the
  --    dropped member's values;
  --    a name that differs is remembered in other_names, notes are appended.
  names_added := ARRAY[]::text[];
  IF lower(drop_row.full_name) <> lower(keep_row.full_name) THEN
    names_added := names_added || drop_row.full_name;
  END IF;
  IF COALESCE(drop_row.other_names, '') <> '' THEN
    names_added := names_added ||
      ARRAY(SELECT trim(n)
            FROM unnest(string_to_array(drop_row.other_names, ',')) AS n
            WHERE COALESCE(trim(n), '') <> '');
  END IF;
  names_added := ARRAY(
    SELECT DISTINCT trim(n)
    FROM unnest(names_added) AS n
    WHERE COALESCE(trim(n), '') <> ''
      AND lower(trim(n)) <> lower(keep_row.full_name)
  );
  new_other_names := NULLIF(
    trim(
      BOTH ', ' FROM
      (SELECT string_agg(names.distinct_name, ', ')
       FROM (
         SELECT DISTINCT trim(x) AS distinct_name
         FROM unnest(
           string_to_array(COALESCE(keep_row.other_names, ''), ',') || names_added
         ) AS x
         WHERE COALESCE(trim(x), '') <> ''
       ) AS names
      )
    ), ''
  );
  IF new_other_names IS DISTINCT FROM keep_row.other_names THEN
    person_fields := person_fields + 1;
  END IF;

  new_note := CASE
    WHEN COALESCE(keep_row.note, '') = '' THEN NULLIF(drop_row.note, '')
    WHEN COALESCE(drop_row.note, '') = '' THEN keep_row.note
    ELSE keep_row.note || E'\n' || drop_row.note
  END;
  IF new_note IS DISTINCT FROM keep_row.note THEN
    person_fields := person_fields + 1;
  END IF;

  person_fields := person_fields
    + (CASE WHEN keep_row.birth_year IS NULL AND drop_row.birth_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_month IS NULL AND drop_row.birth_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_day IS NULL AND drop_row.birth_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_year IS NULL AND drop_row.death_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_month IS NULL AND drop_row.death_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_day IS NULL AND drop_row.death_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_year IS NULL AND drop_row.death_lunar_year IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_month IS NULL AND drop_row.death_lunar_month IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.death_lunar_day IS NULL AND drop_row.death_lunar_day IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.birth_order IS NULL AND drop_row.birth_order IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.generation IS NULL AND drop_row.generation IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN keep_row.avatar_url IS NULL AND drop_row.avatar_url IS NOT NULL THEN 1 ELSE 0 END)
    + (CASE WHEN COALESCE(keep_row.burial_place, '') = ''
            AND COALESCE(drop_row.burial_place, '') <> '' THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_deceased AND drop_row.is_deceased THEN 1 ELSE 0 END)
    + (CASE WHEN NOT keep_row.is_in_law AND drop_row.is_in_law THEN 1 ELSE 0 END);

  UPDATE public.persons p
  SET birth_year = COALESCE(p.birth_year, drop_row.birth_year),
      birth_month = COALESCE(p.birth_month, drop_row.birth_month),
      birth_day = COALESCE(p.birth_day, drop_row.birth_day),
      death_year = COALESCE(p.death_year, drop_row.death_year),
      death_month = COALESCE(p.death_month, drop_row.death_month),
      death_day = COALESCE(p.death_day, drop_row.death_day),
      death_lunar_year = COALESCE(p.death_lunar_year, drop_row.death_lunar_year),
      death_lunar_month = COALESCE(p.death_lunar_month, drop_row.death_lunar_month),
      death_lunar_day = COALESCE(p.death_lunar_day, drop_row.death_lunar_day),
      is_deceased = p.is_deceased OR drop_row.is_deceased,
      is_in_law = p.is_in_law OR drop_row.is_in_law,
      birth_order = COALESCE(p.birth_order, drop_row.birth_order),
      generation = COALESCE(p.generation, drop_row.generation),
      other_names = new_other_names,
      avatar_url = COALESCE(p.avatar_url, drop_row.avatar_url),
      burial_place = COALESCE(NULLIF(p.burial_place, ''), NULLIF(drop_row.burial_place, '')),
      note = new_note,
      updated_at = now()
  WHERE p.id = keep_id;

  -- 5b. Photos the dropped member is tagged in are tagged with the kept one
  -- (photos that already show both just lose the duplicate).
  INSERT INTO public.gallery_item_persons (gallery_item_id, person_id)
  SELECT t.gallery_item_id, keep_id
  FROM public.gallery_item_persons t
  WHERE t.person_id = drop_id
  ON CONFLICT DO NOTHING;

  -- 6. The dropped member leaves; CASCADE clears the rest of its rows.
  DELETE FROM public.persons WHERE id = drop_id;

  RETURN jsonb_build_object(
    'relationships_moved', moved,
    'relationships_dropped', dropped_pair + dropped_duplicate,
    'details_fields_filled', details_fields,
    'person_fields_filled', person_fields
  );
END;
$$;

REVOKE ALL ON FUNCTION private.merge_persons(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.merge_persons(uuid, uuid) TO authenticated;

-- Let PostgREST see the new table right away.
NOTIFY pgrst, 'reload schema';

