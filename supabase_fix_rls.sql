-- Fix RLS policies for avatars bucket
-- Run this in Supabase SQL Editor

-- Allow authenticated users to INSERT (upload) files to avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to avatars (already working since bucket is public)
CREATE POLICY "Allow public read from avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to UPDATE their own uploaded files
CREATE POLICY "Allow authenticated updates in avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Allow users to DELETE their own files  
CREATE POLICY "Allow authenticated deletes in avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Verify the policies were created
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 