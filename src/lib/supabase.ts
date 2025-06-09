import 'react-native-url-polyfill/auto'; // Necesario para que Supabase funcione en React Native
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = 'https://bcndbqnimzyxuqcayxqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';

// Interfaces
interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  single?: boolean;
  limit?: number;
  orderBy?: string;
}

// Validar que las variables estén presentes
if (!SUPABASE_URL) {
  console.error('Error: SUPABASE_URL no está definida');
}
if (!SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_ANON_KEY no está definida');
}

// Pure HTTP Supabase client
class SupabaseHTTPClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(url: string, key: string) {
    this.baseUrl = url;
    this.apiKey = key;
  }

  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, options);
  }

  async signUp(email: string, password: string, metadata?: any) {
    try {
      console.log('🔄 Starting signup with:', { email, metadata });
      
      const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ 
          email, 
          password,
          data: metadata 
        }),
      });
      
      console.log('📡 Response status:', response.status);
      const responseData = await response.json();
      console.log('📦 Response data:', JSON.stringify(responseData, null, 2));
      
      // Handle different response scenarios
      if (response.status === 400) {
        console.log('❌ Bad request error:', responseData);
        return { 
          data: null, 
          error: { 
            message: responseData.msg || responseData.message || 'Invalid email or password format',
            code: responseData.error_code || responseData.code
          } 
        };
      }
      
      // Check if the response is a user object (successful signup)
      if (responseData.id && responseData.email) {
        console.log('✅ User found in response, creating session');
        
        // For signup, we don't get a session immediately, so we'll handle this differently
        const formattedResponse = {
          user: responseData,
          session: null // No session for signup until email confirmation
        };
        
        await AsyncStorage.setItem('supabase_user', JSON.stringify(responseData));
        // Don't save session for signup since it's not confirmed yet
        
        return { data: formattedResponse, error: null };
      } else if (responseData.error) {
        console.log('❌ Error in response:', responseData.error);
        return { data: null, error: responseData.error };
      } else {
        console.log('❌ Unexpected response format');
        return { data: null, error: { message: 'Unexpected response format' } };
      }
      
    } catch (error) {
      console.error('💥 Signup error:', error);
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      console.log('🔄 Starting signin with:', { email });
      
      const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('📡 SignIn Response status:', response.status);
      const data = await response.json();
      console.log('📦 SignIn Response data:', JSON.stringify(data, null, 2));
      
      // Check for successful login (200 status)
      if (response.status === 200 && data.access_token) {
        console.log('✅ Login successful! Processing tokens...');
        
        // Extract user info from JWT token
        try {
          const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));
          const user = {
            id: tokenPayload.sub,
            email: tokenPayload.email || email,
            email_confirmed_at: tokenPayload.email_verified ? new Date().toISOString() : null,
            app_metadata: tokenPayload.app_metadata || {},
            user_metadata: tokenPayload.user_metadata || {},
            aud: tokenPayload.aud,
            role: tokenPayload.role || 'authenticated'
          };
          
          // Create session object
          const session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            expires_at: data.expires_at || (Date.now() + (data.expires_in * 1000)),
            token_type: data.token_type || 'bearer',
            user: user
          };
          
          // Save to storage
          await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
          await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
          
          console.log('✅ Session saved successfully');
          
          return { 
            data: { user, session }, 
            error: null 
          };
          
        } catch (jwtError) {
          console.error('❌ Error parsing JWT:', jwtError);
          return { 
            data: null, 
            error: { 
              message: 'Invalid token format',
              code: 'JWT_PARSE_ERROR'
            } 
          };
        }
      }
      
      // Check for different error scenarios
      if (response.status === 400) {
        console.log('❌ Bad request error:', data);
        return { 
          data: null, 
          error: { 
            message: data.msg || data.message || 'Invalid email or password',
            code: data.error_code || data.code
          } 
        };
      }
      
      if (response.status === 422) {
        console.log('❌ Unprocessable entity error:', data);
        return { 
          data: null, 
          error: { 
            message: data.msg || data.message || 'Invalid credentials',
            code: data.error_code || data.code
          } 
        };
      }
      
      if (data.error) {
        console.log('❌ Error in signin response:', data.error);
        return { data: null, error: data.error };
      }
      
      // Fallback error
      console.log('❌ Unexpected response format');
      return { 
        data: null, 
        error: { 
          message: 'Unexpected response from server',
          code: 'UNEXPECTED_RESPONSE'
        } 
      };
      
    } catch (error) {
      console.error('💥 SignIn network error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      await AsyncStorage.removeItem('supabase_user');
      await AsyncStorage.removeItem('supabase_session');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getUser() {
    try {
      const userString = await AsyncStorage.getItem('supabase_user');
      const sessionString = await AsyncStorage.getItem('supabase_session');
      
      // Return user only if we have both user data and a valid session
      if (userString && sessionString) {
        const user = JSON.parse(userString);
        const session = JSON.parse(sessionString);
        
        // Basic validation
        if (user.id && user.email) {
          return user;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const sessionString = await AsyncStorage.getItem('supabase_session');
      if (!sessionString) return null;
      
      const session = JSON.parse(sessionString);
      
      // Don't automatically clear expired sessions - just return them
      // Let the auth service handle session lifecycle management
      if (session.expires_at && Date.now() > session.expires_at) {
        console.log('⚠️ Session expired but returning it (auth service will handle)');
        return session;
      }
      
      return session;
    } catch (error) {
      console.error('Error reading session:', error);
      return null;
    }
  }

  async refreshSession(refreshToken: string) {
    try {
      console.log('🔄 Refreshing session...');
      
      const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        console.log('✅ Session refreshed successfully');
        
        // Create new session object
        const newSession = {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_in: data.expires_in || 3600,
          expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
          token_type: data.token_type || 'bearer',
          user: data.user
        };
        
        await AsyncStorage.setItem('supabase_session', JSON.stringify(newSession));
        if (data.user) {
          await AsyncStorage.setItem('supabase_user', JSON.stringify(data.user));
        }
        return newSession;
      } else {
        // Don't log the full response data as it may contain sensitive info
        console.log('⚠️ Failed to refresh session - invalid refresh token');
        await this.signOut();
        return null;
      }
    } catch (error) {
      console.log('⚠️ Network error refreshing session - will retry later');
      return null;
    }
  }

  async setSession(tokens: { access_token: string; refresh_token: string }) {
    try {
      console.log('🔄 Setting session with tokens...');
      
      // Create a session object directly - tokens are already validated by Supabase
      const session: any = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (3600 * 1000), // 1 hour from now
      };
      
      // Create a user object from the JWT token
      try {
        const tokenPayload = JSON.parse(atob(tokens.access_token.split('.')[1]));
        const user = {
          id: tokenPayload.sub,
          email: tokenPayload.email,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: tokenPayload.user_metadata || {},
        };
        
        // Add user to session
        session.user = user;
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
        await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
        
        console.log('✅ Session set successfully for user:', user.email);
        return { data: { session, user }, error: null };
        
      } catch (jwtError) {
        console.error('❌ Error parsing JWT token:', jwtError);
        return { data: null, error: { message: 'Invalid token format' } };
      }
      
    } catch (error) {
      console.error('💥 SetSession error:', error);
      return { data: null, error };
    }
  }

  /**
   * Query data from a table
   */
  async query(table: string, options: QueryOptions = {}): Promise<any> {
    try {
      const { 
        select = '*', 
        filters = {}, 
        single = false, 
        limit,
        orderBy 
      } = options;
      
      let url = `${this.baseUrl}/rest/v1/${table}`;
      const params = new URLSearchParams();
      
      // Add select
      params.set('select', select);
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, `eq.${value}`);
        }
      });

      // Add limit
      if (limit) {
        params.set('limit', limit.toString());
      }
      
      // Add order
      if (orderBy) {
        params.set('order', orderBy);
      }
      
        url += `?${params.toString()}`;
      
      console.log(`🔍 Querying Supabase: ${url}`);
      
      // First attempt with standard headers
      let response = await this.makeRequest(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': single ? 'return=representation' : 'return=minimal'
        }
      });
      
      console.log(`📡 Query response status: ${response.status}`);
      
      // If we get 406, try with different Accept header
      if (response.status === 406) {
        console.log('🔄 Retrying with different Accept header...');
        response = await this.makeRequest(url, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pgrst.object+json', // PostgREST specific
            'Prefer': single ? 'return=representation' : 'return=minimal'
          }
        });
        console.log(`📡 Retry response status: ${response.status}`);
        }
      
      // If still 406, try with minimal headers
      if (response.status === 406) {
        console.log('🔄 Retrying with minimal headers...');
        response = await this.makeRequest(url, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
          }
        });
        console.log(`📡 Minimal headers response status: ${response.status}`);
      }
      
      if (response.status === 200) {
      const data = await response.json();
        console.log(`✅ Query successful, found ${Array.isArray(data) ? data.length : (data ? 1 : 0)} records`);
      
        if (single) {
          if (Array.isArray(data) && data.length > 0) {
            return { data: data[0], error: null };
          } else if (!Array.isArray(data) && data) {
      return { data, error: null };
          } else {
            return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
          }
        }
        
        return { data, error: null };
      } else if (response.status === 406) {
        console.log('✅ No rows found (406)');
        return { data: single ? null : [], error: { message: 'No rows found', code: 'PGRST116' } };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Query failed with status: ${response.status} data:`, errorData);
        return { 
          data: null, 
          error: { 
            message: errorData.message || `HTTP ${response.status}`,
            code: errorData.code || response.status.toString(),
            details: errorData.details
          } 
        };
      }
    } catch (error: any) {
      console.error('💥 Query error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message || 'Network error',
          code: 'NETWORK_ERROR'
        } 
      };
    }
  }

  async insert(table: string, values: any) {
    try {
      const session = await this.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found. Please log in again.');
      }

      console.log('📝 Inserting into table:', table, 'with values:', JSON.stringify(values, null, 2));

      const response = await fetch(`${this.baseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(values),
      });
      
      console.log('📡 Insert response status:', response.status);
      console.log('📡 Insert response ok:', response.ok);
      
      const data = await response.json();
      console.log('📦 Insert response data:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        console.error('❌ Insert failed with status:', response.status, 'data:', data);
        return { data: null, error: data };
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.error('⚠️ Insert successful but no data returned - this might indicate a permission issue');
        return { data: [], error: null };
      }
      
      console.log('✅ Insert successful, returned data');
      return { data, error: null };
      
    } catch (error) {
      console.error('💥 Insert network error:', error);
      return { data: null, error };
    }
  }

  async update(table: string, values: any, column: string, value: any) {
    try {
      const session = await this.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found. Please log in again.');
      }

      const response = await fetch(`${this.baseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      return { data, error: response.ok ? null : data };
    } catch (error) {
      return { data: null, error };
    }
  }

  async delete(table: string, column: string, value: any) {
    try {
      const session = await this.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session found. Please log in again.');
      }

      const response = await fetch(`${this.baseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = response.ok ? null : await response.json();
      return { data, error: response.ok ? null : data };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Keep the HTTP client instance
const httpClient = new SupabaseHTTPClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the HTTP client as supabaseClient for compatibility
export const supabaseClient = {
  auth: {
    signUp: async (options: any) => {
      const result = await httpClient.signUp(options.email, options.password, options.options?.data);
      return {
        data: result.data,
        error: result.error
      };
    },
    signInWithPassword: async (options: any) => {
      const result = await httpClient.signIn(options.email, options.password);
      return {
        data: result.data,
        error: result.error
      };
    },
    signOut: () => httpClient.signOut(),
    getUser: async () => {
      const user = await httpClient.getUser();
      return { data: { user } };
    },
    getSession: async () => {
      const session = await httpClient.getSession();
      return { data: { session }, error: null };
    },
    setSession: (tokens: { access_token: string; refresh_token: string }) => 
      httpClient.setSession(tokens),
  },
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: () => httpClient.query(table, { 
          select: columns, 
          filters: { [column]: value }, 
          single: true 
        }),
        order: (orderColumn: string, { ascending = true } = {}) => ({
          single: () => httpClient.query(table, {
            select: columns,
            filters: { [column]: value },
            orderBy: `${orderColumn}.${ascending ? 'asc' : 'desc'}`,
            single: true
          })
        })
      }),
    }),
    insert: (values: any) => httpClient.insert(table, values),
    update: (values: any) => ({
      eq: (column: string, value: any) => httpClient.update(table, values, column, value),
    }),
    delete: () => ({
      eq: (column: string, value: any) => httpClient.delete(table, column, value),
    }),
  }),
  query: (table: string, options: any) => httpClient.query(table, options),
};

// Mock auth object for compatibility
export const auth = {
  signUp: async (options: any) => {
    const result = await httpClient.signUp(options.email, options.password, options.options?.data);
    
    // Return in the expected format
    return {
      data: result.data,
      error: result.error
    };
  },
  signInWithPassword: async (options: any) => {
    const result = await httpClient.signIn(options.email, options.password);
    
    return {
      data: result.data,
      error: result.error
    };
  },
  signOut: () => httpClient.signOut(),
  getUser: async () => {
    const user = await httpClient.getUser();
    return { data: { user } };
  },
  onAuthStateChange: (callback: any) => {
    // Simple implementation - check auth state periodically but less aggressively
    let lastAuthState: string | null = null;
    
    const checkAuth = async () => {
      try {
        const user = await httpClient.getUser();
        const session = await httpClient.getSession();
        
        // Only call callback if auth state actually changed
        const currentAuthState = user ? 'SIGNED_IN' : 'SIGNED_OUT';
        if (currentAuthState !== lastAuthState) {
          lastAuthState = currentAuthState;
          callback(currentAuthState, session);
        }
      } catch (error) {
        console.error('Auth state check error:', error);
      }
    };
    
    // Check immediately
    checkAuth();
    
    // Then check every 30 seconds (less aggressive)
    const interval = setInterval(checkAuth, 30000);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval)
        }
      }
    };
  }
};

// Mock from method for database queries
export const from = (table: string) => ({
  select: (columns: string = '*') => ({
    eq: (column: string, value: any) => ({
      single: () => httpClient.query(table, { select: columns, filters: { [column]: value }, single: true })
    })
  }),
  insert: (values: any) => httpClient.insert(table, values),
  update: (values: any) => ({
    eq: (column: string, value: any) => {
      // TODO: Implement update if needed
      return { data: null, error: 'Update not implemented' };
    }
  })
});

// Types for our database
export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  pickleball_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  city?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  email: string;
  name: string;
  lastname: string;
  level: string;
  city?: string;
  avatarUri?: string;
} 