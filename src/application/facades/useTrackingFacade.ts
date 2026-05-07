import { useEffect, useRef, useCallback } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { GeolocationAdapter } from '../../infrastructure/adapters/GeolocationAdapter';
import { GlobalExceptionHandler } from '../handlers/GlobalExceptionHandler';
import { GlobalSuccessHandler } from '../handlers/GlobalSuccessHandler';
import { SuccessCode } from '../../constants/ResponseCodes';
import { RoutePoint } from '../../domain/models/Journey';
import { ILocationAdapter } from '../../domain/interfaces/ILocationAdapter';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import {
  EMA_ALPHA,
  MAX_OUTLIER_SPEED_KMH,
  SPEED_BUS_MIN_KMH,
  SPEED_TRAIN_MIN_KMH,
  TOURISM_FETCH_DISTANCE_KM,
  TOURISM_RADIUS_M,
} from '../../constants/tracking';
import { MS_PER_HOUR, FORCE_REFETCH_SENTINEL_KM } from '../../constants/math';
import type { ApiBody } from '../../lib/apiResponse';
import type { TourismListDto } from '../dtos/TourismDto';

// 플랫폼 어댑터를 주입받을 수 있도록 설계.
// 미전달 시 웹 기본값(navigator.geolocation)을 사용.
export function useTrackingFacade(locationAdapter?: ILocationAdapter) {
  const {
    isTracking, toggleTracking, setCurrentLocation, addRoutePoint,
    confirmedMode, detectedMode, setDetectedMode, setShowTicketModal,
    setTourismNews,
  } = useLocationStore();

  const adapterRef = useRef<ILocationAdapter>(locationAdapter ?? new GeolocationAdapter());
  const prevLocRef = useRef<RoutePoint | null>(null);
  const lastTourismFetchLoc = useRef<{ lat: number; lng: number } | null>(null);

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
        currentSpeed = dist / timeDiffHours;

        if (currentSpeed > MAX_OUTLIER_SPEED_KMH) {
          console.warn(`[Facade] 이상치 무시: ${currentSpeed.toFixed(1)}km/h`);
          return;
        }

        const prevEma = prevLocRef.current.emaSpeedKmh || 0;
        currentEma = currentSpeed * EMA_ALPHA + prevEma * (1 - EMA_ALPHA);

        if (currentEma > SPEED_BUS_MIN_KMH && currentEma <= SPEED_TRAIN_MIN_KMH && confirmedModeRef.current !== 'bus') {
          newMode = 'bus';
        } else if (currentEma > SPEED_TRAIN_MIN_KMH && confirmedModeRef.current !== 'train') {
          newMode = 'train';
        } else if (currentEma <= SPEED_BUS_MIN_KMH && currentEma > 0 && confirmedModeRef.current !== 'walk') {
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

    const distFromLastFetch = lastTourismFetchLoc.current
      ? getDistanceFromLatLonInKm(
          lastTourismFetchLoc.current.lat, lastTourismFetchLoc.current.lng,
          rawLoc.lat, rawLoc.lng,
        )
      : FORCE_REFETCH_SENTINEL_KM;

    if (distFromLastFetch >= TOURISM_FETCH_DISTANCE_KM) {
      lastTourismFetchLoc.current = { lat: rawLoc.lat, lng: rawLoc.lng };
      fetch(`/api/tourism?lat=${rawLoc.lat}&lng=${rawLoc.lng}&radius=${TOURISM_RADIUS_M}`)
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
    adapter.startTracking(processNewLocation, (err) => GlobalExceptionHandler.handle(err));
    return () => adapter.stopTracking();
  }, [processNewLocation]);

  return {
    startTracking: () => {
      if (!isTracking) {
        toggleTracking();
        prevLocRef.current = null;
        GlobalSuccessHandler.handle(SuccessCode.JOURNEY_STARTED);
      }
    },
    stopTracking: () => {
      if (isTracking) {
        toggleTracking();
        setShowTicketModal(true);
      }
    },
  };
}
