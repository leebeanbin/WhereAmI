import { journeyRepository } from '@/infrastructure/repositories/FirebaseJourneyRepository';
import { Journey, RoutePoint } from '@/domain/models/Journey';

export function useSaveJourneyFacade() {
  const saveJourney = (
    userId: string,
    route: RoutePoint[],
    totalDistanceKm: number,
    totalDurationSec: number
  ): Promise<Journey> => {
    return journeyRepository.saveFullJourney(userId, route, totalDistanceKm, totalDurationSec);
  };

  return { saveJourney };
}
