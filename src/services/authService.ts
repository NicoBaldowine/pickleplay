import { supabaseClient, Profile, UserData, from } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Get Supabase config from the client
const SUPABASE_URL = 'https://bcndbqnimzyxuqcayxqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  profile?: Profile;
  emailVerificationRequired?: boolean;
}

class AuthService {
  private authStateCallbacks: Array<(user: any, profile: Profile | null) => void> = [];

  /**
   * Check if email already exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if email exists:', email);
      
      // Check directly in the profiles table first (most reliable for verified users)
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (!profileError && profileData) {
        console.log('✅ Email found in profiles table - user exists and is verified');
        return true;
      }
      
      // If not in profiles, check if there's a verified user in auth.users
      // We'll use the admin API to check auth.users table
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/auth.users?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=id,email,email_confirmed_at`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        
        if (response.ok) {
          const users = await response.json();
          if (users && users.length > 0) {
            // Check if any user is verified
            const verifiedUser = users.find((user: any) => user.email_confirmed_at);
            if (verifiedUser) {
              console.log('✅ Email found in auth.users and is verified');
              return true;
            } else {
              console.log('⚠️ Email found in auth.users but not verified - allowing signup');
              return false;
            }
          }
        }
      } catch (authCheckError) {
        console.log('⚠️ Could not check auth.users table, falling back to signup attempt');
      }
      
      // If we reach here, email was not found in either table
      console.log('📝 Email not found in any table, allowing signup');
      return false;
      
    } catch (error) {
      console.log('🔧 Error checking email existence:', error);
      // On error, be permissive but log the issue
      return false;
    }
  }

  /**
   * Simplified signup - create auth user first, profile later
   */
  async signUp(email: string, password: string, userData: UserData): Promise<AuthResponse> {
    try {
      console.log('🚀 Starting signup for:', email);
      
      // Step 1: Create auth user (no metadata, no trigger)
      const { data, error } = await supabaseClient.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      if (error) {
        console.error('❌ Auth signup error:', error);
        
        // Handle specific error types
        if (error.message?.includes('already registered')) {
          // This is a real duplicate - user actually exists and is verified
          return {
            success: false,
            error: 'This email is already registered and verified. Please sign in instead, or use "Forgot Password" if you forgot your password.'
          };
        }
        
        if (error.message?.includes('duplicate') || 
            error.message?.includes('already exists') ||
            error.message?.includes('already taken')) {
          return {
            success: false,
            error: 'This email is already in use. Please try signing in instead.'
          };
        }
        
        if (error.message?.includes('rate limit') || 
            error.message?.includes('too many requests')) {
          return {
            success: false,
            error: 'Too many requests. Please wait a moment and try again.'
          };
        }
        
        if (error.message?.includes('email') && 
            error.message?.includes('invalid')) {
          return {
            success: false,
            error: 'Please enter a valid email address.'
          };
        }
        
        if (error.message?.includes('password')) {
          return {
            success: false,
            error: 'Password must be at least 6 characters long.'
          };
        }
        
        // Generic error
        return {
          success: false,
          error: error.message || 'Failed to create account. Please try again.'
        };
      }

      if (!data?.user) {
        return {
          success: false,
          error: 'Failed to create account. Please try again.'
        };
      }

      console.log('✅ Auth user created:', data.user.id);
      console.log('📧 Email verification required');
      
      // Save temporary session info for later profile creation
      const tempUser = {
        ...data.user,
        ...userData, // Save user data for later profile creation
      };

      await AsyncStorage.setItem('supabase_temp_user', JSON.stringify(tempUser));

      return { 
        success: true, 
        user: data.user,
        emailVerificationRequired: true
      };
    } catch (error: any) {
      console.error('💥 Signup error:', error);
      
      // Handle network errors specifically
      if (error.message?.includes('network') || 
          error.message?.includes('fetch')) {
        return { 
          success: false, 
          error: 'Network error. Please check your connection and try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Unexpected error occurred. Please try again.' 
      };
    }
  }

  /**
   * Simplified signin
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🚀 Signing in:', email);
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });
      
      if (error) {
        console.error('❌ SignIn error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          // Check if the user exists first
          const userExists = await this.checkEmailExists(email);
          if (!userExists) {
            return {
              success: false,
              error: 'No account found with this email. Please sign up first.'
            };
          }
          
          return {
            success: false,
            error: 'Incorrect password. Please check your password and try again.'
          };
        }
        
        if (error.message?.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please verify your email first. Check your inbox for the verification link. If you didn\'t receive it, try signing up again to resend the verification email.'
          };
        }
        
        return { 
          success: false, 
          error: error.message || 'Failed to sign in' 
        };
      }

      if (!data?.user) {
        return { 
          success: false, 
          error: 'Failed to sign in. Please try again.' 
        };
      }

      console.log('✅ Signed in successfully:', data.user.id);

      // Save session
      await AsyncStorage.setItem('supabase_user', JSON.stringify(data.user));
      if (data.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      // Get profile
      let profile = await this.getProfile(data.user.id);
      
      // If no profile exists, create one automatically
      if (!profile) {
        console.log('📝 No profile found, creating one automatically...');
        const createProfileResult = await this.createProfile(data.user.id, {
          email: data.user.email,
          name: data.user.user_metadata?.name || 'User',
          lastname: data.user.user_metadata?.lastname || '',
          level: data.user.user_metadata?.level || 'beginner'
        });
        
        if (createProfileResult.success) {
          profile = await this.getProfile(data.user.id);
        }
      }
      
      // Notify listeners
      this.authStateCallbacks.forEach(callback => {
        try {
          callback(data.user, profile);
        } catch (err) {
          console.error('Error in auth callback:', err);
        }
      });

      // 🚀 Start proactive session monitoring
      this.startSessionMonitoring();

      return { 
        success: true, 
        user: data.user,
        profile: profile || undefined
      };
    } catch (error: any) {
      console.error('💥 SignIn error:', error);
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<AuthResponse> {
    try {
      console.log('🚪 Signing out user...');
      
      // Sign out from Supabase
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('❌ Supabase sign out error:', error);
        // Still clear local storage even if Supabase fails
      }

      // Clear ALL storage related to auth - be thorough
      await AsyncStorage.removeItem('supabase_user');
      await AsyncStorage.removeItem('supabase_session');
      await AsyncStorage.removeItem('supabase_temp_user');
      
      // Clear any cached profiles
      try {
        const keys = await AsyncStorage.getAllKeys();
        const profileKeys = keys.filter(key => key.startsWith('profile_'));
        const cacheKeys = keys.filter(key => key.startsWith('profile_cache_time_'));
        
        if (profileKeys.length > 0) {
          await AsyncStorage.multiRemove(profileKeys);
        }
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
      } catch (cacheError) {
        console.log('⚠️ Error clearing profile cache:', cacheError);
      }

      console.log('✅ User signed out and all data cleared');

      // 🛑 Stop session monitoring
      this.stopSessionMonitoring();

      // Notify listeners
      this.authStateCallbacks.forEach(callback => {
        try {
          callback(null, null);
        } catch (err) {
          console.error('Error in auth callback:', err);
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('💥 Sign out error:', error);
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      // 🚀 PROACTIVE SESSION REFRESH - Check and refresh if needed
      try {
        await this.checkAndRefreshSession();
      } catch (refreshError) {
        console.log('⚠️ Proactive refresh failed, continuing with existing session:', refreshError);
      }

      // First check if we have a stored session
      const storedSession = await AsyncStorage.getItem('supabase_session');
      const storedUser = await AsyncStorage.getItem('supabase_user');
      
      // Debug what's actually stored
      console.log('🔍 AsyncStorage debug:', {
        hasStoredUser: !!storedUser,
        hasStoredSession: !!storedSession,
        storedUserLength: storedUser?.length,
        storedSessionLength: storedSession?.length
      });
      
      if (storedUser) {
        let user;
        try {
          user = JSON.parse(storedUser);
          console.log('📋 Parsed user from storage:', {
            hasId: !!user?.id,
            hasEmail: !!user?.email,
            userId: user?.id,
            userEmail: user?.email,
            userKeys: Object.keys(user || {}),
            rawUser: user
          });
          
          // Handle different corrupted user structures
          
          // Case 1: User wrapped in Supabase response structure
          if (user && user.data && !user.id && user.data.id) {
            console.log('🔧 Unwrapping user data from Supabase response structure');
            user = user.data;
            // Save the corrected structure for future use
            await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
            console.log('✅ User structure corrected:', user.id);
          }
          
          // Case 2: Detect {"data": {"user": null}} structure (most common corruption)
          else if (user && user.data && user.data.user === null && !user.id) {
            console.log('⚠️ Detected corrupted user structure: {"data": {"user": null}}');
            
            // Try to get fresh user data from Supabase
            try {
              const freshUserResponse = await supabaseClient.auth.getUser();
              if (freshUserResponse?.data?.user) {
                console.log('✅ Got fresh user data, fixing corrupted storage');
                user = freshUserResponse.data.user;
                await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
                console.log('✅ User data corrected with fresh data:', user.id);
              } else {
                console.log('⚠️ Could not get fresh user data, but continuing with profile fallbacks');
                // Don't return null - let the app continue with profile data as fallback
                // Return a minimal user object that will trigger profile-based authentication
                return { 
                  data: user.data, 
                  _corrupted: true, 
                  _note: 'User data corrupted but app will use profile fallbacks' 
                };
              }
            } catch (freshUserError) {
              console.log('⚠️ Could not fetch fresh user data:', freshUserError);
              // Return minimal structure to allow app to continue with profile fallbacks
              return { 
                data: user.data, 
                _corrupted: true, 
                _note: 'Fresh user fetch failed, using profile fallbacks' 
              };
            }
          }
          
          // Case 3: User object is completely invalid or empty
          else if (!user || (typeof user !== 'object') || (!user.id && !user.data)) {
            console.log('🗑️ User data is completely invalid, clearing...');
            await AsyncStorage.removeItem('supabase_user');
            await AsyncStorage.removeItem('supabase_session');
            
            // Try to get fresh data from Supabase as last resort
            try {
              const freshUser = await supabaseClient.auth.getUser();
              if (freshUser?.data?.user) {
                console.log('✅ Got fresh user from Supabase after clearing corrupted data:', freshUser.data.user.id);
                await AsyncStorage.setItem('supabase_user', JSON.stringify(freshUser.data.user));
                return freshUser.data.user;
              }
            } catch (supabaseError) {
              console.log('⚠️ Could not get fresh user from Supabase');
            }
            
            return null;
          }
          
        } catch (parseError) {
          console.error('❌ Error parsing stored user JSON:', parseError);
          console.log('🗑️ Clearing corrupted JSON user data');
          await AsyncStorage.removeItem('supabase_user');
          
          // Try to get fresh data as recovery
          try {
            const freshUser = await supabaseClient.auth.getUser();
            if (freshUser?.data?.user) {
              console.log('✅ Recovered with fresh user data');
              await AsyncStorage.setItem('supabase_user', JSON.stringify(freshUser.data.user));
              return freshUser.data.user;
            }
          } catch (recoveryError) {
            console.log('⚠️ Could not recover user data');
          }
          
          return null;
        }
        
        // At this point we should have a valid user object
        // Validate that it has the minimum required properties
        if (user && (user.id || (user.data && typeof user.data === 'object'))) {
          console.log('✅ Found valid stored user with ID:', user.id || '[using fallbacks]');
          
          // If we have a stored session, check if it's valid but don't logout if not
          if (storedSession) {
            try {
              const session = JSON.parse(storedSession);
              
              // Convert expires_at to proper timestamp if needed
              const currentTime = Date.now(); // Keep in milliseconds
              const expiresAt = session.expires_at;
              
              // Always return the stored user - maintain persistence
              // Only log session expiration but don't logout automatically
              if (expiresAt && currentTime > expiresAt) {
                console.log('⚠️ Session expired but keeping user logged in for persistence');
                return user;
              } else {
                // Session is still valid or no expiration set
                console.log('✅ Session is valid or no expiration check needed');
                return user;
              }
            } catch (sessionParseError) {
              console.log('⚠️ Error parsing session, but returning user anyway');
              return user;
            }
          } else {
            // No session but we have user - keep them logged in (offline mode)
            console.log('✅ No session but user exists - keeping logged in');
            return user;
          }
        } else {
          console.log('⚠️ User object exists but lacks required properties');
          return null;
        }
      }
      
      // If no stored user/session, try to get from Supabase but don't overwrite stored data
      try {
        const userResponse = await supabaseClient.auth.getUser();
        if (userResponse?.data?.user) {
          console.log('✅ Got user from Supabase:', userResponse.data.user.id);
          
          // Update stored user but don't overwrite if we already had one
          const existingUser = await AsyncStorage.getItem('supabase_user');
          if (!existingUser) {
            await AsyncStorage.setItem('supabase_user', JSON.stringify(userResponse.data.user));
          }
          
          // Also try to get and store the current session
          const sessionResponse = await supabaseClient.auth.getSession();
          if (sessionResponse?.data?.session) {
            const existingSession = await AsyncStorage.getItem('supabase_session');
            if (!existingSession) {
              await AsyncStorage.setItem('supabase_session', JSON.stringify(sessionResponse.data.session));
            }
          }
          
          return userResponse.data.user;
        } else {
          console.log('⚠️ No user data from Supabase');
        }
      } catch (networkError) {
        // If network fails but we have stored user, prioritize stored user
        if (storedUser) {
          console.log('⚠️ Network error, trying to use stored user as fallback');
          try {
            const fallbackUser = JSON.parse(storedUser);
            if (fallbackUser && (fallbackUser.id || fallbackUser.data)) {
              console.log('✅ Using stored user as network fallback');
              return fallbackUser;
            }
          } catch (fallbackError) {
            console.log('⚠️ Could not parse stored user as fallback');
          }
        }
        console.log('⚠️ Network error and no usable stored user');
      }
      
      return null;
    } catch (error) {
      console.error('💥 Error in getCurrentUser:', error);
      
      // Even on error, try to return stored user if available
      try {
        const storedUser = await AsyncStorage.getItem('supabase_user');
        if (storedUser) {
          const fallbackUser = JSON.parse(storedUser);
          if (fallbackUser && (fallbackUser.id || fallbackUser.data)) {
            console.log('⚠️ Error occurred but returning stored user as last resort');
            return fallbackUser;
          }
        }
      } catch (storageError) {
        console.log('⚠️ Could not access stored user as last resort');
      }
      
      return null;
    }
  }

  /**
   * Get user profile from database
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('🔍 Getting profile for user:', userId);
      
      // Check if we have a cached profile first
      try {
        const cachedProfile = await AsyncStorage.getItem(`profile_${userId}`);
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          // Check if cache is not too old (1 hour)
          const cacheTime = await AsyncStorage.getItem(`profile_cache_time_${userId}`);
          if (cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
            console.log('📱 Using cached profile');
            return profile;
          }
        }
      } catch (cacheError) {
        // Ignore cache errors
      }
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Don't log as error if it's just "no rows found"
        const errorMessage = (error as any).message;
        if (errorMessage?.includes('No rows found') || !data) {
          console.log('📝 No profile found - user may need to create one');
        } else {
          console.error('❌ Error fetching profile:', error);
        }
        return null;
      }
      
      if (!data) {
        console.log('📝 No profile found - user may need to create one');
        return null;
      }
      
      console.log('✅ Profile found:', data);
      
      // Cache the profile
      try {
        await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(data));
        await AsyncStorage.setItem(`profile_cache_time_${userId}`, Date.now().toString());
      } catch (cacheError) {
        // Ignore cache errors
      }
      
      return data as Profile;
      
    } catch (error: any) {
      // Handle network errors gracefully
      if (error.message?.includes('Network request failed')) {
        console.log('📵 Network error getting profile - user may be offline');
        
        // Try to get cached profile
        try {
          const cachedProfile = await AsyncStorage.getItem(`profile_${userId}`);
          if (cachedProfile) {
            console.log('📱 Using cached profile due to network error');
            return JSON.parse(cachedProfile);
          }
        } catch (cacheError) {
          // Ignore cache errors
        }
      } else {
        console.error('💥 Error getting profile:', error);
      }
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<AuthResponse> {
    try {
      console.log('🔄 Updating profile for user:', userId);
      console.log('📋 Updates:', updates);
      
      // First, validate that we have user data
      if (!userId) {
        console.error('❌ No user ID provided for profile update');
        return { success: false, error: 'User ID is required' };
      }
      
      // Function to attempt profile update with given session
      const attemptProfileUpdate = async (sessionToken?: string): Promise<{ success: boolean; error?: any }> => {
        try {
          // Set auth header if we have a token
          if (sessionToken) {
            // Use raw HTTP request with explicit auth header for better control
            const response = await fetch(`https://bcndbqnimzyxuqcayxqn.supabase.co/rest/v1/profiles?id=eq.${userId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y',
                'Authorization': `Bearer ${sessionToken}`,
              },
              body: JSON.stringify(updates),
            });
            
            if (response.ok) {
              console.log('✅ Profile updated successfully with session token');
              return { success: true };
            } else {
              const errorData = await response.text();
              console.log('⚠️ Profile update failed with session token:', response.status, errorData);
              return { success: false, error: errorData };
            }
          } else {
            // Fall back to Supabase client without explicit auth
            const { error } = await supabaseClient
              .from('profiles')
              .update(updates)
              .eq('id', userId);
            
            if (error) {
              console.log('⚠️ Profile update failed with Supabase client:', error);
              return { success: false, error };
            } else {
              console.log('✅ Profile updated successfully with Supabase client');
              return { success: true };
            }
          }
        } catch (error) {
          console.log('💥 Error in profile update attempt:', error);
          return { success: false, error };
        }
      };
      
      // Strategy 1: Try with stored session token
      let accessToken = null;
      try {
        const storedSession = await AsyncStorage.getItem('supabase_session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (session?.access_token) {
            accessToken = session.access_token;
            console.log('✅ Found stored session token');
            
            const result = await attemptProfileUpdate(accessToken);
            if (result.success) {
              // Clear profile cache on success
              try {
                await AsyncStorage.removeItem(`profile_${userId}`);
                await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
              } catch (cacheError) {
                // Ignore cache errors
              }
              return { success: true };
            } else {
              console.log('⚠️ Stored session failed, trying fresh session...');
            }
          }
        }
      } catch (sessionError) {
        console.log('⚠️ Error reading stored session:', sessionError);
      }
      
      // Strategy 2: Try to get fresh session from Supabase
      try {
        console.log('🔄 Attempting to get fresh session from Supabase...');
        const sessionResponse = await supabaseClient.auth.getSession();
        if (sessionResponse?.data?.session?.access_token) {
          const freshToken = sessionResponse.data.session.access_token;
          console.log('✅ Got fresh session from Supabase');
          
          // Save the fresh session
          await AsyncStorage.setItem('supabase_session', JSON.stringify(sessionResponse.data.session));
          
          const result = await attemptProfileUpdate(freshToken);
          if (result.success) {
            // Clear profile cache on success
            try {
              await AsyncStorage.removeItem(`profile_${userId}`);
              await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
            } catch (cacheError) {
              // Ignore cache errors
            }
            return { success: true };
          } else {
            console.log('⚠️ Fresh session also failed, trying without auth...');
          }
        } else {
          console.log('⚠️ No fresh session available from Supabase');
        }
      } catch (freshSessionError) {
        console.log('⚠️ Error getting fresh session:', freshSessionError);
      }
      
      // Strategy 3: Try without explicit auth (Supabase client handles it)
      try {
        console.log('🔄 Attempting profile update without explicit auth...');
        const result = await attemptProfileUpdate();
        if (result.success) {
          // Clear profile cache on success
          try {
            await AsyncStorage.removeItem(`profile_${userId}`);
            await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
          } catch (cacheError) {
            // Ignore cache errors
          }
          return { success: true };
        } else {
          console.error('❌ All profile update strategies failed');
          return { 
            success: false, 
            error: 'No valid session found. Please log in again.' 
          };
        }
      } catch (finalError) {
        console.error('💥 Final profile update attempt failed:', finalError);
        return { 
          success: false, 
          error: 'Failed to update profile. Please try signing out and signing back in.' 
        };
      }
      
    } catch (error: any) {
      console.error('💥 Profile update error:', error);
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  /**
   * Create profile using direct HTTP method (for registration flow when session is missing)
   */
  async createProfileDirect(userId: string, userData: Partial<UserData>): Promise<AuthResponse> {
    try {
      console.log('🔧 Creating profile using direct method for user:', userId);
      console.log('📋 UserData received:', userData);
      console.log('🖼️ DEBUG: avatarUri in userData:', userData.avatarUri);
      
      // Validate required data
      if (!userData.name || !userData.lastname) {
        console.error('❌ Missing required fields:', { name: userData.name, lastname: userData.lastname });
        return { 
          success: false, 
          error: 'Missing required profile information (name and lastname)' 
        };
      }
      
      const profileData = {
        id: userId,
        email: userData.email,
        first_name: userData.name || 'User',
        last_name: userData.lastname || '',
        pickleball_level: (userData.level || 'beginner').toLowerCase(),
        city: userData.city,
        avatar_url: userData.avatarUri,
      };

      console.log('📋 Profile data to save:', profileData);

      // Use direct HTTP request with anon key (should work if RLS allows inserts)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(profileData),
      });
      
      console.log('📡 Direct insert response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Profile created successfully via direct method:', result);
        
        // Clear cache and save to storage
        await AsyncStorage.removeItem(`profile_${userId}`);
        await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('❌ Direct insert failed:', errorData);
        
        // If it fails due to auth, try the regular method as fallback
        console.log('🔄 Direct method failed, trying regular method...');
        return await this.createProfile(userId, userData);
      }
      
    } catch (error: any) {
      console.error('💥 Direct profile creation error:', error);
      // Fallback to regular method
      console.log('🔄 Direct method error, trying regular method...');
      return await this.createProfile(userId, userData);
    }
  }

  /**
   * Create user profile after email verification
   */
  async createProfile(userId: string, userData: Partial<UserData>): Promise<AuthResponse> {
    try {
      console.log('📝 Creating/updating profile for verified user:', userId);
      console.log('📋 UserData received:', userData);
      
      // Validate required data
      if (!userData.name || !userData.lastname) {
        console.error('❌ Missing required fields:', { name: userData.name, lastname: userData.lastname });
        return { 
          success: false, 
          error: 'Missing required profile information (name and lastname)' 
        };
      }
      
      const profileData = {
        id: userId,
        email: userData.email,
        first_name: userData.name || 'User',
        last_name: userData.lastname || '',
        pickleball_level: (userData.level || 'beginner').toLowerCase(),
        city: userData.city,
        avatar_url: userData.avatarUri,
      };

      console.log('📋 Profile data to save:', profileData);

      // Clear any existing profile cache before creating
      await AsyncStorage.removeItem(`profile_${userId}`);
      await AsyncStorage.removeItem(`profile_cache_time_${userId}`);

      // First, try to check if profile exists
      const existingProfile = await this.getProfile(userId);
      
      if (existingProfile) {
        console.log('📝 Profile already exists, updating...');
        // Update existing profile
        const { error } = await supabaseClient
          .from('profiles')
          .update({
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            pickleball_level: profileData.pickleball_level,
            city: profileData.city,
            avatar_url: profileData.avatar_url,
          })
          .eq('id', userId);
          
        if (error) {
          console.error('❌ Profile update error:', error);
          return { 
            success: false, 
            error: 'Failed to update profile. Please try again.' 
          };
        }
        
        console.log('✅ Profile updated successfully');
      } else {
        console.log('📝 Creating new profile...');
        // Create new profile
        const { data, error } = await supabaseClient
          .from('profiles')
          .insert(profileData);
        
        console.log('📊 Insert result - data:', data, 'error:', error);
        
        if (error) {
          console.error('❌ Profile creation error:', error);
          // If it's a duplicate key error, try to update instead
          if (error.code === '23505') {
            console.log('🔄 Profile exists but couldn\'t read it, trying update...');
            const { error: updateError } = await supabaseClient
              .from('profiles')
              .update({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                pickleball_level: profileData.pickleball_level,
                city: profileData.city,
                avatar_url: profileData.avatar_url,
              })
              .eq('id', userId);
              
            if (updateError) {
              console.error('❌ Profile update error:', updateError);
              return { 
                success: false, 
                error: 'Failed to create/update profile. Please try again.' 
              };
            }
            console.log('✅ Profile updated successfully after duplicate key error');
          } else {
            return { 
              success: false, 
              error: 'Failed to create profile. Please try again.' 
            };
          }
        } else {
          console.log('✅ Profile created successfully');
        }
      }
      
      // Clear temp user data
      await AsyncStorage.removeItem('supabase_temp_user');
      
      // Clear profile cache again to force fresh read
      await AsyncStorage.removeItem(`profile_${userId}`);
      await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
      
      // Wait a bit for database consistency and then try to verify
      console.log('⏳ Waiting for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time
      
      // Try to verify the profile was created/updated
      const verificationProfile = await this.getProfile(userId);
      if (verificationProfile) {
        console.log('✅ Profile verified after creation:', verificationProfile);
        return { success: true };
      } else {
        // If verification fails, try one more time with direct query
        console.log('🔄 First verification failed, trying direct query...');
        
        try {
          const { data: directData, error: directError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (directData && !directError) {
            console.log('✅ Profile found via direct query:', directData);
            // Cache it for future use
            await AsyncStorage.setItem(`profile_${userId}`, JSON.stringify(directData));
            await AsyncStorage.setItem(`profile_cache_time_${userId}`, Date.now().toString());
            return { success: true };
          }
        } catch (directQueryError) {
          console.log('Direct query also failed:', directQueryError);
        }
        
        // If both verification attempts fail, but we know the profile was created successfully,
        // we'll consider it a success and let the user proceed
        console.log('⚠️ Profile verification failed but creation was successful - allowing user to proceed');
        console.log('🔄 The profile should be available on next app restart or login');
        return { success: true };
      }
      
    } catch (error: any) {
      console.error('💥 Profile creation error:', error);
      return { success: false, error: error.message || 'Failed to create profile' };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      console.log('🔑 Sending password reset email to:', email);
      
      // Get the redirect URL for password reset
      const redirectUrl = Linking.createURL('reset-password', {
        queryParams: { type: 'recovery' }
      });
      
      console.log('🔗 Reset redirect URL:', redirectUrl);
      
      // Using Supabase's resetPasswordForEmail method
      const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          redirect_to: redirectUrl,
          gotrue_meta_security: {} // Required by Supabase
        }),
      });
      
      const data = await response.json();
      
      if (response.ok || response.status === 200) {
        console.log('✅ Password reset email sent successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to send reset email:', data);
        return { 
          success: false, 
          error: data.msg || data.message || 'Failed to send reset email' 
        };
      }
    } catch (error: any) {
      console.error('💥 Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send reset email' 
      };
    }
  }

  /**
   * Update user password (for reset password flow)
   */
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'No user session found' };
      }
      
      console.log('🔐 Updating password for user:', user.id);
      
      // Get current session for auth
      const sessionData = await AsyncStorage.getItem('supabase_session');
      if (!sessionData) {
        return { success: false, error: 'No active session' };
      }
      
      const session = JSON.parse(sessionData);
      
      // Update password using HTTP API
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          password: newPassword
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Password updated successfully');
        return { success: true };
      } else {
        console.error('❌ Password update error:', data);
        return { 
          success: false, 
          error: data.msg || data.message || 'Failed to update password' 
        };
      }
      
    } catch (error: any) {
      console.error('💥 Update password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      };
    }
  }

  /**
   * Check if session is about to expire and refresh proactively
   */
  async checkAndRefreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionData = await AsyncStorage.getItem('supabase_session');
      if (!sessionData) {
        return { success: false, error: 'No session found' };
      }

      const session = JSON.parse(sessionData);
      if (!session.expires_at) {
        return { success: true }; // No expiration set
      }

      const currentTime = Date.now();
      const expiresAt = session.expires_at;
      const timeUntilExpiry = expiresAt - currentTime;
      
      // Refresh if less than 10 minutes (600,000ms) until expiry
      if (timeUntilExpiry < 600000) {
        console.log('🔄 Session expires soon, refreshing proactively...', {
          timeUntilExpiry: Math.round(timeUntilExpiry / 60000), // minutes
          expiresAt: new Date(expiresAt).toLocaleTimeString()
        });
        return await this.refreshSession();
      }

      console.log('✅ Session still valid for', Math.round(timeUntilExpiry / 60000), 'minutes');
      return { success: true };
    } catch (error: any) {
      console.error('Error checking session expiry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start proactive session management
   */
  startSessionMonitoring(): void {
    // Clear any existing interval
    if ((this as any).sessionMonitorInterval) {
      clearInterval((this as any).sessionMonitorInterval);
    }

    console.log('🚀 Starting proactive session monitoring...');
    
    // Check every 3 minutes if session needs refresh
    (this as any).sessionMonitorInterval = setInterval(async () => {
      try {
        const result = await this.checkAndRefreshSession();
        if (!result.success && result.error !== 'No session found') {
          console.log('⚠️ Background session refresh failed:', result.error);
        }
      } catch (error) {
        console.log('⚠️ Background session check error:', error);
      }
    }, 180000); // 3 minutes
  }

  /**
   * Stop session monitoring (useful for cleanup)
   */
  stopSessionMonitoring(): void {
    if ((this as any).sessionMonitorInterval) {
      console.log('🛑 Stopping session monitoring');
      clearInterval((this as any).sessionMonitorInterval);
      (this as any).sessionMonitorInterval = null;
    }
  }

  /**
   * Refresh session tokens
   */
  async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Attempting to refresh session tokens...');
      
      // Get current stored session
      const sessionData = await AsyncStorage.getItem('supabase_session');
      if (!sessionData) {
        console.log('❌ No stored session to refresh');
        return { success: false, error: 'No stored session' };
      }
      
      const session = JSON.parse(sessionData);
      if (!session.refresh_token) {
        console.log('❌ No refresh token available');
        return { success: false, error: 'No refresh token' };
      }
      
      // Call Supabase refresh endpoint
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          refresh_token: session.refresh_token
        }),
      });
      
      console.log('📡 Refresh response status:', response.status);
      const data = await response.json();
      
      if (response.status === 200 && data.access_token) {
        console.log('✅ Session refreshed successfully');
        
        // Parse new user info from JWT
        try {
          const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
          const user = {
            id: tokenPayload.sub,
            email: tokenPayload.email,
            email_confirmed_at: tokenPayload.email_verified ? new Date().toISOString() : null,
            app_metadata: tokenPayload.app_metadata || {},
            user_metadata: tokenPayload.user_metadata || {},
            aud: tokenPayload.aud,
            role: tokenPayload.role || 'authenticated'
          };
          
          // Create new session
          const newSession = {
            access_token: data.access_token,
            refresh_token: data.refresh_token || session.refresh_token,
            expires_in: data.expires_in,
            expires_at: data.expires_at || (Date.now() + (data.expires_in * 1000)),
            token_type: data.token_type || 'bearer',
            user: user
          };
          
          // Update storage
          await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
          await AsyncStorage.setItem('supabase_session', JSON.stringify(newSession));
          
          console.log('✅ New session saved to storage');
          return { success: true };
          
        } catch (jwtError) {
          console.error('❌ Error parsing refreshed JWT:', jwtError);
          return { success: false, error: 'Invalid refreshed token' };
        }
      } else {
        console.error('❌ Failed to refresh session:', data);
        return { success: false, error: data.message || 'Refresh failed' };
      }
      
    } catch (error: any) {
      console.error('💥 Error refreshing session:', error);
      return { success: false, error: error.message || 'Refresh error' };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: any, profile: Profile | null) => void) {
    // Add callback
    this.authStateCallbacks.push(callback);
    
    // Variables para evitar logs repetidos y chequeos excesivos
    let lastUserState: string | null = null;
    let lastProfileState: boolean | null = null;
    let isChecking = false;
    let consecutiveErrors = 0;
    
    // Check current state immediately
    this.getCurrentUser().then(async (user) => {
      if (user) {
        const profile = await this.getProfile(user.id);
        callback(user, profile);
        lastUserState = user.id;
        lastProfileState = !!profile;
      } else {
        callback(null, null);
        lastUserState = null;
        lastProfileState = null;
      }
    });

    // Much less aggressive periodic check - only check every 10 minutes
    // and be very tolerant of errors to maintain session persistence
    const interval = setInterval(async () => {
      if (isChecking) return; // Evitar chequeos superpuestos
      
      try {
        isChecking = true;
        const user = await this.getCurrentUser();
        const currentUserState = user?.id || null;
        
        if (user) {
          // Only check profile if user state changed to avoid unnecessary calls
          let profile = null;
          let currentProfileState = lastProfileState;
          
          if (currentUserState !== lastUserState) {
            profile = await this.getProfile(user.id);
            currentProfileState = !!profile;
          } else {
            // Keep the same profile state if user hasn't changed
            currentProfileState = lastProfileState;
          }
          
          // Reset error counter on success
          consecutiveErrors = 0;
          
          // Solo llamar el callback si algo cambió
          if (currentUserState !== lastUserState || currentProfileState !== lastProfileState) {
            console.log('🔄 Auth state changed - User:', !!user, 'Profile:', !!profile);
            callback(user, profile || null);
            lastUserState = currentUserState;
            lastProfileState = currentProfileState;
          }
        } else {
          // Be much more tolerant - only logout after many failures and only if user was previously logged in
          consecutiveErrors++;
          
          // Only force logout after 10 consecutive failures over 100 minutes
          if (lastUserState !== null && consecutiveErrors >= 10) {
            console.log('⚠️ Many auth check failures over long period, logging out user');
            callback(null, null);
            lastUserState = null;
            lastProfileState = null;
          } else if (lastUserState !== null) {
            console.log('⚠️ Auth check failed but keeping user logged in (attempt', consecutiveErrors, '/10)');
          }
        }
      } catch (error: any) {
        consecutiveErrors++;
        
        // Solo loggear si es un error real, no si es esperado
        if (!(error as any).message?.includes('No rows found')) {
          console.log('⚠️ Auth state check error (attempt', consecutiveErrors, '/10):', error);
        }
        
        // Only logout after many consecutive errors over a long period
        if (lastUserState !== null && consecutiveErrors >= 10) {
          console.log('⚠️ Too many auth check errors over long period, logging out user');
          callback(null, null);
          lastUserState = null;
          lastProfileState = null;
        }
      } finally {
        isChecking = false;
      }
    }, 600000); // Check every 10 minutes instead of 2 minutes

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            clearInterval(interval);
            const index = this.authStateCallbacks.indexOf(callback);
            if (index > -1) {
              this.authStateCallbacks.splice(index, 1);
            }
          }
        }
      }
    };
  }

  /**
   * Force refresh of auth state - useful after profile creation
   */
  async forceAuthStateRefresh(): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const currentProfile = await this.getProfile(currentUser.id);
        console.log('🔄 Forcing auth state refresh - User:', !!currentUser, 'Profile:', !!currentProfile);
        
        // Notify all listeners
        this.authStateCallbacks.forEach(callback => {
          try {
            callback(currentUser, currentProfile);
          } catch (err) {
            console.error('Error in auth callback:', err);
          }
        });
      } else {
        // No user - notify listeners of signed out state
        this.authStateCallbacks.forEach(callback => {
          try {
            callback(null, null);
          } catch (err) {
            console.error('Error in auth callback:', err);
          }
        });
      }
    } catch (error) {
      console.error('Error forcing auth state refresh:', error);
    }
  }
}

export const authService = new AuthService(); 