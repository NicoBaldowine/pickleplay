import { supabaseClient } from '../lib/supabase';

export interface Court {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  is_free: boolean;
  created_at: string;
  distance?: string; // Will be calculated based on user location
}

class CourtsService {
  private readonly tableName = 'courts';

  /**
   * Get all courts for a specific city
   */
  async getCourtsByCity(city: string = 'Denver'): Promise<Court[]> {
    try {
      console.log('🏟️ Fetching courts for city:', city);
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { city: city },
        orderBy: 'name.asc'
      });

      if (result.error) {
        console.error('Error fetching courts:', result.error);
        throw result.error;
      }

      const courts = result.data || [];
      console.log(`✅ Found ${courts.length} courts in ${city}`);
      return courts;
    } catch (error) {
      console.error('Error fetching courts:', error);
      throw error;
    }
  }

  /**
   * Get all courts (regardless of city)
   */
  async getAllCourts(): Promise<Court[]> {
    try {
      console.log('🏟️ Fetching all courts');
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        orderBy: 'city.asc,name.asc'
      });

      if (result.error) {
        console.error('Error fetching all courts:', result.error);
        throw result.error;
      }

      const courts = result.data || [];
      console.log(`✅ Found ${courts.length} total courts`);
      return courts;
    } catch (error) {
      console.error('Error fetching all courts:', error);
      throw error;
    }
  }

  /**
   * Get courts filtered by free/paid status
   */
  async getCourtsByType(city: string = 'Denver', isFree?: boolean): Promise<Court[]> {
    try {
      console.log('🏟️ Fetching courts for city:', city, 'isFree:', isFree);
      
      const filters: any = { city: city };
      if (isFree !== undefined) {
        filters.is_free = isFree;
      }

      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: filters,
        orderBy: 'name.asc'
      });

      if (result.error) {
        console.error('Error fetching courts by type:', result.error);
        throw result.error;
      }

      const courts = result.data || [];
      console.log(`✅ Found ${courts.length} courts (free: ${isFree}) in ${city}`);
      return courts;
    } catch (error) {
      console.error('Error fetching courts by type:', error);
      throw error;
    }
  }

  /**
   * Get a single court by ID
   */
  async getCourtById(courtId: string): Promise<Court | null> {
    try {
      console.log('🔍 Getting court:', courtId);
      
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { id: courtId },
        single: true
      });

      if (result.error || !result.data) {
        console.log('📝 Court not found');
        return null;
      }

      console.log('✅ Court found');
      return result.data;
    } catch (error) {
      console.error('💥 Error getting court:', error);
      return null;
    }
  }

  /**
   * Format court display name with free/paid indicator
   */
  formatCourtDisplayInfo(court: Court) {
    return {
      title: court.name,
      subtitle: court.address,
      paymentStatus: court.is_free ? 'Free' : 'Paid',
      isPaid: !court.is_free
    };
  }
}

export const courtsService = new CourtsService(); 