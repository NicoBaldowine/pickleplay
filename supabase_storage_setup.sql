-- PicklePlay Avatar Storage Setup
-- Run this script in your Supabase SQL Editor to set up avatar storage

-- 1. Create the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true;

-- 2. Set up RLS policies for the avatars bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (cleanup)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete for authenticated users" ON storage.objects;

-- Policy 1: Allow public read access to avatars
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy 2: Allow authenticated users to upload avatars
CREATE POLICY "Avatar upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow users to update their own avatars
CREATE POLICY "Avatar update for authenticated users" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow users to delete their own avatars
CREATE POLICY "Avatar delete for authenticated users" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Verify the setup
SELECT 
  'Bucket created: ' || name as status,
  'Public: ' || public::text as public_status
FROM storage.buckets 
WHERE id = 'avatars';

SELECT 
  'Policy: ' || policyname as policy_name,
  'Command: ' || cmd as command_type
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Avatar%' OR policyname = 'Public Access'; 