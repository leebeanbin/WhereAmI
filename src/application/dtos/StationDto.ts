export interface StationDto {
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
  type: 'bus' | 'subway';
}

export interface GeocodeDto {
  cityCode: string;
  regionName: string;
}

export interface JourneyStatsDto {
  totalDistanceKm: number;
  totalDurationSec: number;
  journeyCount: number;
  activeSession?: {
    isTracking: boolean;
    speedKmh: number;
    mode: string;
  };
}
