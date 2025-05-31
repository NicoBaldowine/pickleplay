import { supabaseClient, Profile, UserData } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
  profile?: Profile;
}

class AuthService {
  async signUp(email: string, password: string, userData: UserData): Promise<AuthResponse> {
    try {
      console.log('🚀 AuthService.signUp called with:', { email, userData });
      
      // Sign up the user
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.name,
            last_name: userData.lastname,
            pickleball_level: userData.level.toLowerCase(),
          },
        },
      });
      
      console.log('📋 Signup result:', { data: !!data, error: !!error });
      console.log('👤 User data:', data?.user ? 'Present' : 'Missing');
      
      if (error) {
        console.error('❌ Signup error:', error);
        const errorMessage = error.message || 'Error creating account';
        const errorCode = (error as any).code || 'UNKNOWN_ERROR';
        console.log('🔍 Error details:', { message: errorMessage, code: errorCode });
        return { success: false, error: errorMessage };
      }

      if (!data || !data.user) {
        console.error('❌ No user data returned from signup');
        return { success: false, error: 'No user data returned' };
      }

      console.log('✅ User created successfully:', data.user.id);

      // Try to get the profile (might be created by trigger)
      let profile = await this.getProfile(data.user.id);
      console.log('👤 Profile fetched:', profile ? 'Found' : 'Not found');

      // If no profile found, create one manually
      if (!profile) {
        console.log('🔧 Creating profile manually...');
        const profileData = {
          id: data.user.id,
          email: data.user.email || '',
          first_name: userData.name,
          last_name: userData.lastname,
          pickleball_level: userData.level.toLowerCase(),
        };

        const { data: insertedProfile } = await supabaseClient.from('profiles').insert(profileData);
        
        if (insertedProfile && insertedProfile.length > 0) {
          profile = insertedProfile[0];
          console.log('✅ Profile created manually');
        } else {
          // Create a temporary profile object for the response
          profile = {
            id: data.user.id,
            email: data.user.email || '',
            first_name: userData.name,
            last_name: userData.lastname,
            full_name: `${userData.name} ${userData.lastname}`,
            pickleball_level: userData.level.toLowerCase() as any,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          console.log('⚠️ Using temporary profile object');
        }
      }

      // Create and save a proper session for the authenticated user
      const session = {
        access_token: `authenticated_${data.user.id}_${Date.now()}`, // Create a unique token
        user: data.user,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        token_type: 'bearer',
        refresh_token: `refresh_${data.user.id}_${Date.now()}`
      };

      // Save both user and session to AsyncStorage
      await AsyncStorage.setItem('supabase_user', JSON.stringify(data.user));
      await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
      console.log('💾 Session saved for user:', data.user.id);

      return { 
        success: true, 
        user: data.user,
        profile: profile || undefined
      };
    } catch (error: any) {
      console.error('💥 AuthService signup error:', error);
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🚀 AuthService.signIn called with email:', email);
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('📋 SignIn result:', { data: !!data, error: !!error });
      console.log('👤 User data:', data?.user ? 'Present' : 'Missing');
      
      if (error) {
        console.error('❌ SignIn error:', error);
        
        // Provide more specific error messages
        let errorMessage = error.message || 'Error signing in';
        
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        }
        
        return { success: false, error: errorMessage };
      }

      if (!data.user) {
        console.error('❌ No user data returned from signin');
        return { success: false, error: 'No user data returned from signin. Please check your credentials.' };
      }

      console.log('✅ User signed in successfully:', data.user.id);

      // Save user and session to AsyncStorage for consistent access
      await AsyncStorage.setItem('supabase_user', JSON.stringify(data.user));
      
      if (data.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(data.session));
        console.log('💾 Session saved for user:', data.user.id);
      }

      // Get user profile
      const profile = await this.getProfile(data.user.id);
      console.log('👤 Profile fetched:', profile ? 'Found' : 'Not found');

      if (!profile) {
        console.error('❌ No profile found for user');
        return { success: false, error: 'User profile not found. Please contact support.' };
      }

      return { 
        success: true, 
        user: data.user,
        profile: profile
      };
    } catch (error: any) {
      console.error('💥 AuthService signin error:', error);
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        return { success: false, error: typeof error === 'string' ? error : 'Error signing out' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  async getCurrentUser(): Promise<any | null> {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      return user;
    } catch (error) {
      return null;
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('🔍 Getting profile for user:', userId);
      
      // First try to get profile from stored user data
      const userString = await AsyncStorage.getItem('supabase_user');
      if (userString) {
        const user = JSON.parse(userString);
        const userMetadata = user.user_metadata || {};
        
        // Create profile from user metadata
        const profile: Profile = {
          id: user.id,
          email: user.email || '',
          first_name: userMetadata.first_name || 'User',
          last_name: userMetadata.last_name || '',
          full_name: `${userMetadata.first_name || 'User'} ${userMetadata.last_name || ''}`.trim(),
          pickleball_level: userMetadata.pickleball_level || 'beginner',
          created_at: user.created_at || new Date().toISOString(),
          updated_at: user.updated_at || new Date().toISOString(),
        };
        
        console.log('✅ Profile created from stored user data');
        return profile;
      }
      
      // If no stored data, try to get from database
      console.log('🔄 No stored user data, trying database...');
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('❌ Database profile fetch error:', error);
        } else if (data) {
          console.log('✅ Profile found in database');
          return data as Profile;
        }
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
      }
      
      console.log('❌ No profile found anywhere');
      return null;
    } catch (error) {
      console.error('💥 Error getting profile:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<AuthResponse> {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) {
        return { success: false, error: typeof error === 'string' ? error : 'Error updating profile' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unexpected error occurred' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: any, profile: Profile | null) => void) {
    // Check auth state immediately
    this.getCurrentUser().then(async (user) => {
      if (user) {
        const profile = await this.getProfile(user.id);
        callback(user, profile);
      } else {
        callback(null, null);
      }
    });

    // Set up periodic check with longer interval to reduce errors
    const interval = setInterval(async () => {
      try {
        const user = await this.getCurrentUser();
        if (user) {
          const profile = await this.getProfile(user.id);
          callback(user, profile);
        } else {
          callback(null, null);
        }
      } catch (error) {
        console.error('Auth state check error:', error);
        // Don't call callback on error to avoid false negatives
      }
    }, 60000); // Check every 60 seconds instead of 30

    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval)
        }
      }
    };
  }
}

export const authService = new AuthService(); 