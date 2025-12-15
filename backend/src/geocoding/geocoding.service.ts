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
  private readonly cacheTtlSeconds: number;
  private readonly cache = new Map<string, { result: GeocodeResult | null; expiresAt: number }>();

  constructor() {
    const envTtl = process.env.GEOCODING_CACHE_TTL_SECONDS;
    this.cacheTtlSeconds = envTtl ? parseInt(envTtl, 10) : 86400; // default 24 hours
  }

  async geocodeLocation(location: string): Promise<GeocodeResult | null> {
    if (!location || location.trim().length === 0) return null;

    const key = location.trim().toLowerCase();
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.result;
    }
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
        const res: GeocodeResult = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
        };
        this.cache.set(key, { result: res, expiresAt: now + this.cacheTtlSeconds * 1000 });
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
        };
      }
      this.cache.set(key, { result: null, expiresAt: now + this.cacheTtlSeconds * 1000 });
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