-- PicklePlay Avatar Storage Fix (Final Version)
-- This script handles existing policies and creates a completely permissive setup

-- 1. Drop ALL existing policies that might be conflicting
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on avatars" ON storage.objects;

-- 2. Create or update the avatars bucket to be completely public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true;

-- 3. Create ONE super permissive policy that allows everything
CREATE POLICY "avatars_all_access" ON storage.objects
FOR ALL 
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. Verify the setup
SELECT 
  'Bucket: ' || name as bucket_name,
  'Public: ' || public::text as is_public
FROM storage.buckets 
WHERE id = 'avatars';

SELECT 
  'Policy: ' || policyname as policy_name
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname = 'avatars_all_access'; 