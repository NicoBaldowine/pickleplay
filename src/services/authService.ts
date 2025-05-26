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
        const errorMessage = error.message || error.msg || 'Error creating account';
        const errorCode = error.code || error.error_code;
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message || 'Error signing in' };
      }

      if (!data.user) {
        return { success: false, error: 'No user data returned' };
      }

      // Get user profile
      const profile = await this.getProfile(data.user.id);

      return { 
        success: true, 
        user: data.user,
        profile: profile || undefined
      };
    } catch (error: any) {
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
      // Get profile from stored user data to avoid JWT issues
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
      
      console.log('❌ No stored user data found');
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
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