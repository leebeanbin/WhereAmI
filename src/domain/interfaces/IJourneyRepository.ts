import { Journey, RoutePoint } from '../models/Journey';

export interface IJourneyRepository {
  createJourney(userId: string): Promise<Journey>;
  saveRoutePoint(journeyId: string, point: RoutePoint): Promise<void>;
  getJourney(journeyId: string): Promise<Journey | null>;
  completeJourney(journeyId: string, totalDistanceKm: number, totalDurationSec: number): Promise<void>;
}
