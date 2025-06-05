# PicklePlay Avatar Upload Setup Guide

## Current Issues
Your avatar upload feature has these problems:
1. **Storage Bucket Missing**: The "avatars" bucket doesn't exist in Supabase Storage
2. **RLS Policies**: Row Level Security policies are blocking uploads 
3. **User Session Issues**: Session authentication is inconsistent

## Quick Fix (Recommended)

### Step 1: Create Storage Bucket & Policies
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `supabase_storage_setup.sql`
4. Click **Run** to execute the script

### Step 2: Verify Setup
After running the SQL script, verify in your Supabase Dashboard:

1. **Storage → Buckets**: Should show "avatars" bucket with Public = true
2. **SQL Editor**: Run this query to check policies:
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND schemaname = 'storage';
   ```

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Create Storage Bucket
1. Go to **Storage** in your Supabase Dashboard
2. Click **Create Bucket**
3. Name: `avatars`
4. **Check "Public bucket"** ✅
5. Click **Create bucket**

### 2. Set Up RLS Policies
Go to **SQL Editor** and run these commands one by one:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated uploads
CREATE POLICY "Avatar upload for authenticated users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

## Testing the Fix

After setup, test avatar upload:

1. **Open PicklePlay app**
2. **Go to Profile screen**
3. **Tap the camera icon**
4. **Select "Photo Library"**
5. **Choose an image**
6. **Save profile**

## Expected Behavior

✅ **What should work now:**
- Image selection from gallery shows the image immediately
- Upload succeeds with authenticated session
- Fallback to anon key if session issues occur
- Better error messages for any remaining issues

✅ **Improved error handling:**
- Detects corrupted user sessions and fixes them
- Better fallback logic for user ID detection
- More helpful error messages

## Troubleshooting

### Still getting "Bucket not found" error?
- Verify the bucket name is exactly `avatars` (lowercase)
- Check that the bucket is marked as Public

### Still getting "Row Level Security" errors?
- Make sure you ran all the RLS policy commands
- Check that RLS is enabled on storage.objects table

### Image not showing after selection?
- Check the app logs for image loading errors
- Make sure the device has storage permissions

### Session/Authentication errors?
- Try signing out and signing back in
- The app will now handle corrupted sessions better

## What Was Fixed

1. **Better User ID Detection**: Now handles corrupted user objects like `{"data": {"user": null}}`
2. **Dual Upload Strategy**: Tries authenticated upload first, falls back to anon key
3. **Session Recovery**: Attempts to fix corrupted session data automatically  
4. **Image Display**: Better handling of local vs remote image URIs
5. **Error Messages**: More specific error messages for different failure scenarios

The app should now work much more reliably for avatar uploads! 