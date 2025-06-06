import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: string;
  message: string;
}

class LocationService {
  private userLocation: UserLocation | null = null;

  /**
   * Request location permissions and get current position
   */
  async getCurrentLocation(): Promise<{ success: boolean; location?: UserLocation; error?: LocationError }> {
    try {
      console.log('📍 Requesting location permissions...');
      
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Location permission denied');
        return {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Location permission was denied. Please enable location access in settings to see distances to courts.'
          }
        };
      }

      console.log('✅ Location permission granted, getting position...');
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds timeout
      });

      const userLocation: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      this.userLocation = userLocation;
      console.log('✅ Location obtained:', userLocation);

      return {
        success: true,
        location: userLocation
      };

    } catch (error) {
      console.error('💥 Error getting location:', error);
      return {
        success: false,
        error: {
          code: 'LOCATION_ERROR',
          message: 'Unable to get your current location. Please check your GPS settings.'
        }
      };
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in miles
   */
  calculateDistance(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(targetLat - userLat);
    const dLon = this.toRadians(targetLon - userLon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(userLat)) *
        Math.cos(this.toRadians(targetLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 0.1) {
      return '< 0.1 mi';
    } else if (distance < 1) {
      return `${distance} mi`;
    } else {
      return `${distance} mi`;
    }
  }

  /**
   * Get cached user location
   */
  getCachedLocation(): UserLocation | null {
    return this.userLocation;
  }

  /**
   * Clear cached location
   */
  clearLocation(): void {
    this.userLocation = null;
  }
}

export const locationService = new LocationService(); 