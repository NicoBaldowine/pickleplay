-- SIMPLE APPROACH FOR AVATARS STORAGE
-- Run this in Supabase SQL Editor

-- First, let's check if we can create buckets via SQL (might not work due to permissions)
-- If this doesn't work, create the bucket manually in Dashboard

-- Option 1: Try to insert bucket directly (might not work)
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 
  5242880
) ON CONFLICT (id) DO NOTHING;

-- Option 2: If the above doesn't work, MANUALLY create the bucket:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create Bucket" 
-- 3. Name: "avatars"
-- 4. Public: ON (this makes it accessible)
-- 5. File size limit: 5MB
-- 6. Allowed types: image/jpeg,image/png,image/gif,image/webp

-- Verify the bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars'; 