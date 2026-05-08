import { IJourneyRepository } from '../../domain/interfaces/IJourneyRepository';
import { Journey, RoutePoint } from '../../domain/models/Journey';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, limit, where, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { JOURNEYS_FETCH_LIMIT } from '../../constants/api';

export class FirebaseJourneyRepository implements IJourneyRepository {
  async createJourney(userId: string): Promise<Journey> {
    const journeyRef = doc(collection(db, 'journeys'));
    const shareId = nanoid(8);

    const newJourney: Journey = {
      journeyId: journeyRef.id,
      userId,
      status: 'active',
      startTime: Date.now(),
      shareId,
      totalDistanceKm: 0,
      totalDurationSec: 0,
    };

    await setDoc(journeyRef, { ...newJourney, createdAt: serverTimestamp() });
    return newJourney;
  }

  async saveRoutePoint(journeyId: string, point: RoutePoint): Promise<void> {
    const pointRef = doc(collection(db, `journeys/${journeyId}/routePoints`));
    await setDoc(pointRef, { ...point, timestamp: serverTimestamp() });
  }

  async getJourney(journeyId: string): Promise<Journey | null> {
    const docRef = doc(db, 'journeys', journeyId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Journey) : null;
  }

  async completeJourney(journeyId: string, totalDistanceKm: number, totalDurationSec: number): Promise<void> {
    const docRef = doc(db, 'journeys', journeyId);
    await updateDoc(docRef, {
      status: 'completed',
      totalDistanceKm,
      totalDurationSec,
      endTime: Date.now(),
      updatedAt: serverTimestamp(),
    });
  }

  async saveFullJourney(userId: string, route: RoutePoint[], totalDistanceKm: number, totalDurationSec: number): Promise<Journey> {
    const journeyRef = doc(collection(db, 'journeys'));
    const shareId = nanoid(8);

    const newJourney: Journey = {
      journeyId: journeyRef.id,
      userId,
      status: 'completed',
      startTime: route.length > 0 ? route[0].time : Date.now(),
      endTime: Date.now(),
      shareId,
      totalDistanceKm,
      totalDurationSec,
    };

    await setDoc(journeyRef, {
      ...newJourney,
      route,
      createdAt: serverTimestamp(),
    });

    return newJourney;
  }

  async listJourneys(userId: string, maxCount: number = JOURNEYS_FETCH_LIMIT): Promise<Journey[]> {
    const q = query(
      collection(db, 'journeys'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(maxCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Journey);
  }

  async getJourneyByShareId(shareId: string): Promise<Journey | null> {
    const q = query(
      collection(db, 'journeys'),
      where('shareId', '==', shareId),
      limit(1),
    );
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as Journey);
  }
}

export const journeyRepository = new FirebaseJourneyRepository();
