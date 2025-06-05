-- PicklePlay Avatar Storage Setup (Simplified Version)
-- This version works without special admin permissions

-- 1. Create the avatars bucket (if it doesn't exist)
-- This should work for most users
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true;

-- 2. Verify the bucket was created
SELECT 
  'Bucket created: ' || name as status,
  'Public: ' || public::text as public_status
FROM storage.buckets 
WHERE id = 'avatars'; 