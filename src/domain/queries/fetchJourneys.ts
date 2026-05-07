import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Journey } from '../models/Journey';
import { DEFAULT_USER_ID, JOURNEYS_FETCH_LIMIT } from '../../constants/api';

export async function fetchJourneys(userId: string = DEFAULT_USER_ID, maxCount: number = JOURNEYS_FETCH_LIMIT): Promise<Journey[]> {
  const q = query(
    collection(db, 'journeys'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Journey);
}

export async function fetchJourneyByShareId(shareId: string): Promise<Journey | null> {
  const q = query(
    collection(db, 'journeys'),
    where('shareId', '==', shareId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Journey;
}
