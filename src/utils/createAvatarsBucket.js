// Create avatars bucket using HTTP API instead of JS client to avoid React Native compatibility issues
const SUPABASE_URL = 'https://bcndbqnimzyxuqcayxqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';

export const createAvatarsBucket = async () => {
  try {
    console.log('🪣 Attempting to create avatars bucket...');
    
    // First check if bucket already exists
    const checkResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      }
    });
    
    if (checkResponse.ok) {
      const buckets = await checkResponse.json();
      console.log('📋 Existing buckets:', buckets);
      
      const avatarsBucket = buckets.find(bucket => bucket.id === 'avatars' || bucket.name === 'avatars');
      if (avatarsBucket) {
        console.log('✅ Avatars bucket already exists:', avatarsBucket);
        return { success: true, data: 'Bucket already exists' };
      }
    }
    
    console.log('📤 Bucket not found, attempting to create...');
    
    // Try to create bucket using anon key (might work if RLS policies allow)
    const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        id: 'avatars',
        name: 'avatars',
        public: true,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        file_size_limit: 5242880 // 5MB in bytes
      })
    });

    const responseText = await createResponse.text();
    console.log('📡 Bucket creation response:', createResponse.status, responseText);

    if (createResponse.ok) {
      console.log('✅ Avatars bucket created successfully');
      return { success: true, data: responseText };
    } else if (createResponse.status === 409) {
      // Bucket already exists - this is actually success
      console.log('✅ Avatars bucket already exists (409 response)');
      return { success: true, data: 'Bucket already exists' };
    } else if (createResponse.status === 403) {
      console.log('⚠️ Permission denied creating bucket - manual setup required');
      // Return success but indicate manual setup is needed
      return { 
        success: false, 
        error: 'MANUAL_SETUP_REQUIRED',
        message: 'Please create the "avatars" bucket manually in Supabase Dashboard'
      };
    } else {
      console.error('❌ Error creating bucket:', responseText);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.error('💥 Exception creating bucket:', error);
    return { success: false, error: error.message || error };
  }
};

// Alternative: Use direct public URLs without bucket dependency
export const getPublicAvatarUrl = (fileName) => {
  // Return a direct URL that should work if the bucket is public
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
}; 