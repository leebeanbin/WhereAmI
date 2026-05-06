export interface RoutePoint {
  lat: number;
  lng: number;
  time: number;
  speedKmh: number;
  emaSpeedKmh: number;
  inferredMode: string | null;
  confirmedMode: string | null;
  stickerId?: string | null;
}

export interface Journey {
  journeyId: string;
  userId: string;
  status: 'active' | 'completed';
  startTime: number;
  endTime?: number;
  shareId: string;
  totalDistanceKm: number;
  totalDurationSec: number;
}
