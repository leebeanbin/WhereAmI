import { journeyRepository } from '@/infrastructure/repositories/FirebaseJourneyRepository';
import { Journey } from '@/domain/models/Journey';
import { DEFAULT_USER_ID, JOURNEYS_FETCH_LIMIT } from '@/constants/api';

export async function fetchJourneys(userId: string = DEFAULT_USER_ID, maxCount: number = JOURNEYS_FETCH_LIMIT): Promise<Journey[]> {
  return journeyRepository.listJourneys(userId, maxCount);
}

export async function fetchJourneyByShareId(shareId: string): Promise<Journey | null> {
  return journeyRepository.getJourneyByShareId(shareId);
}
