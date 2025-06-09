import { supabaseClient } from '../lib/supabase';
import { locationService, UserLocation } from './locationService';

export interface Court {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  is_free: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
  distance?: string; // Will be calculated based on user location
  distanceValue?: number; // Numeric distance for sorting
}

class CourtsService {
  private readonly tableName = 'courts';

  /**
   * Get all courts for a specific city with optional distance calculation
   */
  async getCourtsByCity(city: string = 'Denver', includeDistance: boolean = true): Promise<Court[]> {
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

      let courts = result.data || [];
      console.log(`✅ Found ${courts.length} courts in ${city}`);

      // Add distance calculations if requested
      if (includeDistance) {
        courts = await this.addDistancesToCourts(courts);
      }

      return courts;
    } catch (error) {
      console.error('Error fetching courts:', error);
      throw error;
    }
  }

  /**
   * Add distance calculations to courts and sort by proximity
   */
  async addDistancesToCourts(courts: Court[]): Promise<Court[]> {
    try {
      // Get user location
      const locationResult = await locationService.getCurrentLocation();
      
      if (!locationResult.success || !locationResult.location) {
        console.log('📍 Location not available, returning courts without distances');
        return courts;
      }

      const userLocation = locationResult.location;
      console.log('📍 Calculating distances from user location:', userLocation);

      // Calculate distances for each court
      const courtsWithDistance = courts.map(court => {
        if (court.latitude && court.longitude) {
          const distance = locationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            court.latitude,
            court.longitude
          );

          return {
            ...court,
            distance: locationService.formatDistance(distance),
            distanceValue: distance
          };
        } else {
          // No coordinates available for this court
          return {
            ...court,
            distance: 'Distance N/A',
            distanceValue: 999 // Put courts without coordinates at the end
          };
        }
      });

      // Sort by distance (closest first)
      courtsWithDistance.sort((a, b) => {
        return (a.distanceValue || 999) - (b.distanceValue || 999);
      });

      console.log('✅ Distances calculated and courts sorted by proximity');
      return courtsWithDistance;

    } catch (error) {
      console.error('Error calculating distances:', error);
      // Return original courts if distance calculation fails
      return courts;
    }
  }

  /**
   * Get all courts (regardless of city)
   */
  async getAllCourts(includeDistance: boolean = false): Promise<Court[]> {
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

      let courts = result.data || [];
      console.log(`✅ Found ${courts.length} total courts`);

      // Add distance calculations if requested
      if (includeDistance) {
        courts = await this.addDistancesToCourts(courts);
      }

      return courts;
    } catch (error) {
      console.error('Error fetching all courts:', error);
      throw error;
    }
  }

  /**
   * Get all courts with distance calculation and sorting by proximity
   */
  async getAllCourtsWithDistance(): Promise<Court[]> {
    return this.getAllCourts(true);
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