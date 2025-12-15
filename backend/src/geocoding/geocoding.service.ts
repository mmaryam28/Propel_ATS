import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

@Injectable()
export class GeocodingService {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  async geocodeLocation(location: string): Promise<GeocodeResult | null> {
    try {
      const response = await axios.get(this.nominatimUrl, {
        params: {
          q: location,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'JobTracker/1.0',
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Calculate distance using Haversine formula (approximate)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}