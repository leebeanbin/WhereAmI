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

export async function fetchJourneys(userId: string = 'anonymous', maxCount: number = 20): Promise<Journey[]> {
  const q = query(
    collection(db, 'journeys'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Journey);
}
