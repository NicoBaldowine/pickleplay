import { supabaseClient } from '../lib/supabase';

export interface CityRequest {
  id: string;
  city_name: string;
  requested_by?: string; // user_id si está logueado
  created_at: string;
  user_email?: string; // para trackear mejor
}

class CityRequestsService {
  private readonly tableName = 'city_requests';

  /**
   * Save a city request to track expansion opportunities
   */
  async saveCityRequest(cityName: string, userEmail?: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🏙️ Saving city request:', cityName);
      
      const requestData = {
        city_name: cityName.trim(),
        requested_by: userId || null,
        user_email: userEmail || null,
        created_at: new Date().toISOString()
      };

      const result = await supabaseClient.query(this.tableName, {
        operation: 'insert',
        data: requestData
      });

      if (result.error) {
        console.error('❌ Error saving city request:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ City request saved successfully');
      return { success: true };
    } catch (error) {
      console.error('💥 Error in saveCityRequest:', error);
      return { success: false, error: 'Failed to save city request' };
    }
  }

  /**
   * Get all city requests (for admin/analytics)
   */
  async getAllCityRequests(): Promise<CityRequest[]> {
    try {
      console.log('📊 Fetching all city requests');
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        orderBy: 'created_at.desc'
      });

      if (result.error) {
        console.error('Error fetching city requests:', result.error);
        throw result.error;
      }

      const requests = result.data || [];
      console.log(`✅ Found ${requests.length} city requests`);
      return requests;
    } catch (error) {
      console.error('Error fetching city requests:', error);
      throw error;
    }
  }

  /**
   * Get city requests count by city name
   */
  async getCityRequestCounts(): Promise<{ [cityName: string]: number }> {
    try {
      console.log('📈 Getting city request counts');
      
      const requests = await this.getAllCityRequests();
      const counts: { [cityName: string]: number } = {};
      
      requests.forEach(request => {
        const cityName = request.city_name.toLowerCase();
        counts[cityName] = (counts[cityName] || 0) + 1;
      });

      console.log('✅ City request counts calculated:', counts);
      return counts;
    } catch (error) {
      console.error('Error calculating city request counts:', error);
      return {};
    }
  }
}

export const cityRequestsService = new CityRequestsService(); 