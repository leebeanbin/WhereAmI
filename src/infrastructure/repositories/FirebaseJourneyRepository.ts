import { IJourneyRepository } from '../../domain/interfaces/IJourneyRepository';
import { Journey, RoutePoint } from '../../domain/models/Journey';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

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

    // Firebase 통신 예외 처리는 ErrorService 등을 통해 상위 계층에서 Catch 되도록 Throw
    await setDoc(journeyRef, {
      ...newJourney,
      createdAt: serverTimestamp()
    });

    return newJourney;
  }

  async saveRoutePoint(journeyId: string, point: RoutePoint): Promise<void> {
    const pointRef = doc(collection(db, `journeys/${journeyId}/routePoints`));
    await setDoc(pointRef, {
      ...point,
      timestamp: serverTimestamp()
    });
  }

  async getJourney(journeyId: string): Promise<Journey | null> {
    const docRef = doc(db, 'journeys', journeyId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Journey;
    }
    return null;
  }

  async completeJourney(journeyId: string, totalDistanceKm: number, totalDurationSec: number): Promise<void> {
    const docRef = doc(db, 'journeys', journeyId);
    await updateDoc(docRef, {
      status: 'completed',
      totalDistanceKm,
      totalDurationSec,
      endTime: Date.now(),
      updatedAt: serverTimestamp()
    });
  }

  // 여정 종료 시 한 번에 전체 데이터를 저장하는 최적화된 메서드
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

    // Firebase 통신 예외 처리는 ErrorService 등을 통해 상위 계층에서 Catch 되도록 Throw
    await setDoc(journeyRef, {
      ...newJourney,
      route: route, // 전체 궤적을 하나의 문서에 배열로 저장 (문서 크기 1MB 제한 내에서 충분)
      createdAt: serverTimestamp()
    });

    return newJourney;
  }
}

// 싱글톤 인스턴스 내보내기
export const journeyRepository = new FirebaseJourneyRepository();
