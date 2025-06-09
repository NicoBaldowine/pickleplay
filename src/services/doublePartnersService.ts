import { supabaseClient } from '../lib/supabase';
import { authService } from './authService';

export interface DoublePartner {
  id: string;
  user_id: string;
  partner_name: string;
  partner_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  partner_email?: string;
  partner_phone?: string;
  avatar_url?: string;
  is_registered: boolean;
  registered_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerData {
  partner_name: string;
  partner_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  partner_email?: string;
  partner_phone?: string;
  avatar_url?: string;
}

class DoublePartnersService {
  private readonly tableName = 'double_partners';

  /**
   * Get all partners for a user
   */
  async getPartners(userId: string): Promise<DoublePartner[]> {
    try {
      console.log('🔍 Getting partners for user:', userId);
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { user_id: userId },
        orderBy: 'created_at.desc'
      });

      if (result.error) {
        console.error('Error fetching partners:', result.error);
        throw result.error;
      }

      const partners = result.data || [];
      console.log(`✅ Found ${partners.length} partners`);
      return partners;
    } catch (error) {
      console.error('Error fetching partners:', error);
      throw error;
    }
  }

  /**
   * Create a new partner - with automatic session refresh on JWT expiry
   */
  async createPartner(userId: string, partnerData: CreatePartnerData): Promise<{ success: boolean; partnerId?: string; error?: string }> {
    try {
      console.log('📝 Creating partner for user:', userId);
      console.log('📋 Partner data:', partnerData);

      const insertData = {
        user_id: userId,
        partner_name: partnerData.partner_name,
        partner_level: partnerData.partner_level,
        partner_email: partnerData.partner_email,
        partner_phone: partnerData.partner_phone,
        avatar_url: partnerData.avatar_url,
        is_registered: false, // For now, partners are not registered by default
      };

      // First attempt
      const { data, error } = await supabaseClient.from(this.tableName).insert(insertData);

      if (error) {
        console.error('Error creating partner:', error);
        
        // Check for JWT expired errors specifically
        if (error.code === 'PGRST301' || error.message?.includes('JWT expired') || error.message?.includes('Session expired')) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          // Try to refresh session
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed, retrying create...');
            
            // Retry the create with fresh token
            const { data: retryData, error: retryError } = await supabaseClient.from(this.tableName).insert(insertData);
            
            if (retryError) {
              console.error('Error creating partner after refresh:', retryError);
              if (retryError.code === '23505') {
                return { success: false, error: 'You already have a partner with this name' };
              }
              return { success: false, error: retryError.message || 'Failed to create partner after refresh' };
            }
            
            if (!retryData || (Array.isArray(retryData) && retryData.length === 0)) {
              return { success: false, error: 'No data returned after insert with refresh' };
            }

            const partner = Array.isArray(retryData) ? retryData[0] : retryData;
            console.log('✅ Partner created successfully after session refresh:', partner.id);
            return { success: true, partnerId: partner.id };
          } else {
            console.log('❌ Session refresh failed:', refreshResult.error);
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        }
        
        if (error.code === '23505') {
          return { success: false, error: 'You already have a partner with this name' };
        }
        return { success: false, error: error.message || 'Failed to create partner' };
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { success: false, error: 'No data returned after insert' };
      }

      const partner = Array.isArray(data) ? data[0] : data;
      console.log('✅ Partner created successfully:', partner.id);
      return { success: true, partnerId: partner.id };

    } catch (error: any) {
      console.error('💥 Error creating partner:', error);
      
      // Check for JWT expired in catch block too
      if (error && 
          (error.code === 'PGRST301' || error.message?.includes('JWT expired'))) {
        console.log('🔄 JWT expired in catch block, attempting to refresh session...');
        
        try {
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed in catch block, retrying create...');
            
            // Retry the create
            const insertData = {
              user_id: userId,
              partner_name: partnerData.partner_name,
              partner_level: partnerData.partner_level,
              partner_email: partnerData.partner_email,
              partner_phone: partnerData.partner_phone,
              avatar_url: partnerData.avatar_url,
              is_registered: false,
            };
            
            const { data: retryData, error: retryError } = await supabaseClient.from(this.tableName).insert(insertData);
            
            if (retryError) {
              if (retryError.code === '23505') {
                return { success: false, error: 'You already have a partner with this name' };
              }
              return { success: false, error: retryError.message || 'Failed to create partner after refresh' };
            }
            
            if (!retryData || (Array.isArray(retryData) && retryData.length === 0)) {
              return { success: false, error: 'No data returned after insert with refresh' };
            }

            const partner = Array.isArray(retryData) ? retryData[0] : retryData;
            return { success: true, partnerId: partner.id };
          } else {
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        } catch (refreshError) {
          return { success: false, error: 'Session expired and refresh failed. Please log in again.' };
        }
      }
      
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  /**
   * Update a partner - with automatic session refresh on JWT expiry
   */
  async updatePartner(partnerId: string, updates: Partial<CreatePartnerData>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Updating partner:', partnerId);
      
      // First attempt
      const { error } = await supabaseClient.from(this.tableName).update({
        ...updates,
        updated_at: new Date().toISOString()
      }).eq('id', partnerId);

      if (error) {
        console.error('Error updating partner:', error);
        
        // Check for JWT expired errors specifically
        if (error.code === 'PGRST301' || error.message?.includes('JWT expired') || error.message?.includes('Session expired')) {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          // Try to refresh session
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed, retrying update...');
            
            // Retry the update with fresh token
            const { error: retryError } = await supabaseClient.from(this.tableName).update({
              ...updates,
              updated_at: new Date().toISOString()
            }).eq('id', partnerId);
            
            if (retryError) {
              console.error('Error updating partner after refresh:', retryError);
              return { success: false, error: retryError.message || 'Failed to update partner after refresh' };
            }
            
            console.log('✅ Partner updated successfully after session refresh');
            return { success: true };
          } else {
            console.log('❌ Session refresh failed:', refreshResult.error);
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        }
        
        if (error.code === '23505') {
          return { success: false, error: 'You already have a partner with this name' };
        }
        return { success: false, error: error.message || 'Failed to update partner' };
      }

      console.log('✅ Partner updated successfully');
      return { success: true };

    } catch (error: any) {
      console.error('💥 Error updating partner:', error);
      
      // Check for JWT expired in catch block too
      if (error && 
          (error.code === 'PGRST301' || error.message?.includes('JWT expired'))) {
        console.log('🔄 JWT expired in catch block, attempting to refresh session...');
        
        try {
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed in catch block, retrying update...');
            
            // Retry the update
            const { error: retryError } = await supabaseClient.from(this.tableName).update({
              ...updates,
              updated_at: new Date().toISOString()
            }).eq('id', partnerId);
            
            if (retryError) {
              return { success: false, error: retryError.message || 'Failed to update partner after refresh' };
            }
            
            return { success: true };
          } else {
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        } catch (refreshError) {
          return { success: false, error: 'Session expired and refresh failed. Please log in again.' };
        }
      }
      
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  /**
   * Delete a partner
   */
  async deletePartner(partnerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting partner:', partnerId);
      
      const { error } = await supabaseClient.from(this.tableName).delete().eq('id', partnerId);

      if (error) {
        console.error('Error deleting partner:', error);
        return { success: false, error: error.message || 'Failed to delete partner' };
      }

      console.log('✅ Partner deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('💥 Error deleting partner:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  /**
   * Get a single partner by ID
   */
  async getPartner(partnerId: string): Promise<DoublePartner | null> {
    try {
      console.log('🔍 Getting partner:', partnerId);
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { id: partnerId },
        single: true
      });

      if (result.error || !result.data) {
        console.log('📝 Partner not found');
        return null;
      }

      console.log('✅ Partner found');
      return result.data;

    } catch (error) {
      console.error('💥 Error getting partner:', error);
      return null;
    }
  }
  /**
   * Upload partner photo to Supabase storage
   */
  async uploadPartnerPhoto(imageUri: string, partnerId: string): Promise<string | undefined> {
    try {
      console.log('🚀 Starting partner photo upload for:', partnerId);
      
      // Create a unique filename
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `partner_${partnerId}_${Date.now()}.${fileExtension}`;
      
      // Create a file blob from the image URI
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('📦 Partner photo prepared:', { fileName, size: blob.size, type: blob.type });
      
      // Use anon key for public bucket access
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';
      
      console.log('📤 Uploading partner photo to storage...');
      
      const uploadResponse = await fetch(
        `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/partner_photos/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': blob.type || 'image/jpeg',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: blob,
        }
      );
      
      console.log('📡 Partner photo upload response status:', uploadResponse.status);
      
      if (uploadResponse.ok) {
        // Get the public URL
        const publicURL = `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/public/partner_photos/${fileName}`;
        console.log('✅ Partner photo upload successful:', publicURL);
        return publicURL;
      } else {
        const errorText = await uploadResponse.text();
        console.error('❌ Partner photo upload failed:', errorText);
        return undefined;
      }
      
    } catch (error) {
      console.error('💥 Partner photo upload error:', error);
      return undefined;
    }
  }
}

export const doublePartnersService = new DoublePartnersService(); 