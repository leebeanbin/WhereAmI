import { useEffect, useRef, useCallback } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { GlobalExceptionHandler } from '../handlers/GlobalExceptionHandler';
import { GlobalSuccessHandler } from '../handlers/GlobalSuccessHandler';
import { SuccessCode } from '../../constants/ResponseCodes';
import { RoutePoint } from '../../domain/models/Journey';
import { ILocationAdapter } from '../../domain/interfaces/ILocationAdapter';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import {
  EMA_ALPHA,
  MAX_OUTLIER_SPEED_KMH,
  MIN_MOVE_THRESHOLD_M,
  SPEED_BUS_MIN_KMH,
  SPEED_BUS_OFF_KMH,
  SPEED_TRAIN_MIN_KMH,
  SPEED_TRAIN_OFF_KMH,
  TOURISM_FETCH_DISTANCE_KM,
  TOURISM_RADIUS_M,
} from '../../constants/tracking';
import { MS_PER_HOUR, FORCE_REFETCH_SENTINEL_KM } from '../../constants/math';
import type { ApiBody } from '../../lib/apiResponse';
import type { TourismListDto } from '../dtos/TourismDto';

const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
const BFF_BASE = isReactNative
  ? (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://whereami.vercel.app')
  : '';

export function useTrackingFacade(locationAdapter: ILocationAdapter) {
  const {
    isTracking, toggleTracking, setCurrentLocation, addRoutePoint,
    confirmedMode, detectedMode, setDetectedMode, setShowTicketModal,
    setTourismNews,
  } = useLocationStore();

  const adapterRef = useRef<ILocationAdapter>(locationAdapter);
  const prevLocRef = useRef<RoutePoint | null>(null);
  const lastTourismFetchLoc = useRef<{ lat: number; lng: number } | null>(null);
  const lastActivePostTimeRef = useRef<number>(0);

  // Ref로 최신 상태를 유지해 processNewLocation을 안정된 참조로 만듦.
  // 클로저로 캡처하면 상태 변경마다 useEffect가 재실행되어 GPS watchPosition이 재시작됨.
  const isTrackingRef = useRef(isTracking);
  const confirmedModeRef = useRef(confirmedMode);
  const detectedModeRef = useRef(detectedMode);

  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);
  useEffect(() => { confirmedModeRef.current = confirmedMode; }, [confirmedMode]);
  useEffect(() => { detectedModeRef.current = detectedMode; }, [detectedMode]);

  const processNewLocation = useCallback((rawLoc: { lat: number; lng: number; time: number }) => {
    setCurrentLocation({ lat: rawLoc.lat, lng: rawLoc.lng });

    if (!isTrackingRef.current) return;

    let currentSpeed = 0;
    let currentEma = 0;
    let newMode = detectedModeRef.current;

    if (prevLocRef.current) {
      const dist = getDistanceFromLatLonInKm(
        prevLocRef.current.lat, prevLocRef.current.lng,
        rawLoc.lat, rawLoc.lng,
      );
      const timeDiffHours = (rawLoc.time - prevLocRef.current.time) / MS_PER_HOUR;

      if (timeDiffHours > 0) {
        // Dead Zone: 8m 미만 이동은 GPS 드리프트로 간주, 속도 0 처리
        const distMeters = dist * 1000;
        if (distMeters >= MIN_MOVE_THRESHOLD_M) {
          currentSpeed = dist / timeDiffHours;
        }

        if (currentSpeed > MAX_OUTLIER_SPEED_KMH) {
          console.warn(`[Facade] 이상치 무시: ${currentSpeed.toFixed(1)}km/h`);
          return;
        }

        const prevEma = prevLocRef.current.emaSpeedKmh || 0;
        currentEma = currentSpeed * EMA_ALPHA + prevEma * (1 - EMA_ALPHA);

        // 히스테리시스 모드 감지: ON 임계값 과 ON, OFF 임계값 각각 다르게 설정
        const current = confirmedModeRef.current;
        if (currentEma > SPEED_TRAIN_MIN_KMH && current !== 'train') {
          newMode = 'train';
        } else if (currentEma <= SPEED_TRAIN_OFF_KMH && current === 'train') {
          // 기차를 타다가 45km/h 이하로 떨어지면 버스로
          newMode = currentEma > SPEED_BUS_OFF_KMH ? 'bus' : 'walk';
        } else if (currentEma > SPEED_BUS_MIN_KMH && currentEma <= SPEED_TRAIN_MIN_KMH && current !== 'bus' && current !== 'train') {
          newMode = 'bus';
        } else if (currentEma <= SPEED_BUS_OFF_KMH && current === 'bus') {
          // 버스를 타다가 8km/h 이하로 떨어지면 도보로
          newMode = 'walk';
        }
      }
    }

    if (newMode !== detectedModeRef.current) {
      setDetectedMode(newMode);
    }

    const point: RoutePoint = {
      lat: rawLoc.lat,
      lng: rawLoc.lng,
      time: rawLoc.time,
      speedKmh: currentSpeed,
      emaSpeedKmh: currentEma,
      inferredMode: newMode,
      confirmedMode: confirmedModeRef.current,
    };

    addRoutePoint(point);
    prevLocRef.current = point;

    // 서버에 실시간 모험 상태 전송 (iOS Widget / 다른 클라이언트와 실시간 동기화용)
    const now = Date.now();
    if (now - lastActivePostTimeRef.current > 5000) {
      lastActivePostTimeRef.current = now;
      const activeModeText =
        confirmedModeRef.current === 'bus' ? '버스' :
        confirmedModeRef.current === 'train' ? '기차/지하철' :
        '도보';

      fetch(`${BFF_BASE}/api/tracking/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isTracking: true,
          speedKmh: currentEma,
          mode: activeModeText,
        }),
      }).catch(err => console.error('[Active Tracking POST Error]', err));
    }

    const distFromLastFetch = lastTourismFetchLoc.current
      ? getDistanceFromLatLonInKm(
          lastTourismFetchLoc.current.lat, lastTourismFetchLoc.current.lng,
          rawLoc.lat, rawLoc.lng,
        )
      : FORCE_REFETCH_SENTINEL_KM;

    if (distFromLastFetch >= TOURISM_FETCH_DISTANCE_KM) {
      lastTourismFetchLoc.current = { lat: rawLoc.lat, lng: rawLoc.lng };
      fetch(`${BFF_BASE}/api/tourism?lat=${rawLoc.lat}&lng=${rawLoc.lng}&radius=${TOURISM_RADIUS_M}`)
        .then(res => res.json() as Promise<ApiBody<TourismListDto>>)
        .then(body => {
          if (body.success && body.data.items.length > 0) {
            const randomItem = body.data.items[Math.floor(Math.random() * body.data.items.length)];
            setTourismNews({ title: randomItem.title, distance: parseInt(randomItem.dist) });
          }
        })
        .catch(err => console.error('[Tourism Fetch Error]', err));
    }

  // Zustand setter들은 안정된 참조 → deps 변경 없이 callback이 한 번만 생성됨
  }, [setCurrentLocation, addRoutePoint, setDetectedMode, setTourismNews]);

  useEffect(() => {
    const adapter = adapterRef.current;
    void adapter.startTracking(processNewLocation, (err) => GlobalExceptionHandler.handle(err));
    return () => adapter.stopTracking();
  }, [processNewLocation]);

  return {
    startTracking: () => {
      if (!isTracking) {
        toggleTracking();
        prevLocRef.current = null;
        GlobalSuccessHandler.handle(SuccessCode.JOURNEY_STARTED);

        // 서버 활성 상태 설정
        fetch(`${BFF_BASE}/api/tracking/active`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isTracking: true,
            speedKmh: 0,
            mode: '도보',
          }),
        }).catch(err => console.error('[Active Tracking Start Error]', err));
      }
    },
    stopTracking: () => {
      if (isTracking) {
        toggleTracking();
        setShowTicketModal(true);

        // 서버 활성 상태 해제
        fetch(`${BFF_BASE}/api/tracking/active`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isTracking: false,
            speedKmh: 0,
            mode: '도보',
          }),
        }).catch(err => console.error('[Active Tracking Stop Error]', err));
      }
    },
  };
}
