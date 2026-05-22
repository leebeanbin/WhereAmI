export type TransportMode = 'walk' | 'bus' | 'train' | null;

export interface RoutePoint {
  lat: number;
  lng: number;
  time: number;
  speedKmh: number;
  emaSpeedKmh: number;
  inferredMode: TransportMode;
  confirmedMode: TransportMode;
  stickerId?: string | null;
  visitedStationName?: string | null;
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
  route?: RoutePoint[];
}
