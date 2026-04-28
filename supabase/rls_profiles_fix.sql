-- =============================================================
-- APEG: Fix RLS Policies for profiles table
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. Enable RLS on profiles (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to READ any profile (needed for player search)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow users to UPDATE only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Allow users to INSERT their own profile (on signup)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 5. Prevent users from deleting profiles
-- (no DELETE policy = nobody can delete)

-- =============================================================
-- VERIFY: After running, check policies are active:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- =============================================================
