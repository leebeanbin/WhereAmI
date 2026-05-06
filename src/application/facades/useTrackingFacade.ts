import { useEffect, useRef, useCallback } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { GeolocationAdapter } from '../../infrastructure/adapters/GeolocationAdapter';
import { GlobalExceptionHandler } from '../handlers/GlobalExceptionHandler';
import { GlobalSuccessHandler } from '../handlers/GlobalSuccessHandler';
import { SuccessCode } from '../../constants/ResponseCodes';
import { RoutePoint } from '../../domain/models/Journey';

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
};

export function useTrackingFacade() {
  const {
    isTracking, toggleTracking, setCurrentLocation, addRoutePoint,
    confirmedMode, detectedMode, setDetectedMode, setShowTicketModal,
    setTourismNews
  } = useLocationStore();

  const adapterRef = useRef(new GeolocationAdapter());
  const prevLocRef = useRef<RoutePoint | null>(null);
  const lastTourismFetchLoc = useRef<{lat: number, lng: number} | null>(null);

  // Ref로 최신 상태를 유지해 processNewLocation을 안정된 참조로 만듦.
  // 클로저로 캡처하면 상태 변경마다 useEffect가 재실행되어 GPS watchPosition이 재시작됨.
  const isTrackingRef = useRef(isTracking);
  const confirmedModeRef = useRef(confirmedMode);
  const detectedModeRef = useRef(detectedMode);

  useEffect(() => { isTrackingRef.current = isTracking; }, [isTracking]);
  useEffect(() => { confirmedModeRef.current = confirmedMode; }, [confirmedMode]);
  useEffect(() => { detectedModeRef.current = detectedMode; }, [detectedMode]);

  const processNewLocation = useCallback((rawLoc: {lat: number, lng: number, time: number}) => {
     setCurrentLocation({ lat: rawLoc.lat, lng: rawLoc.lng });

     if (!isTrackingRef.current) return;

     let currentSpeed = 0;
     let currentEma = 0;
     let newMode = detectedModeRef.current;

     if (prevLocRef.current) {
        const dist = getDistanceFromLatLonInKm(prevLocRef.current.lat, prevLocRef.current.lng, rawLoc.lat, rawLoc.lng);
        const timeDiffHours = (rawLoc.time - prevLocRef.current.time) / (1000 * 60 * 60);

        if (timeDiffHours > 0) {
            currentSpeed = dist / timeDiffHours;

            if (currentSpeed > 350) {
                console.warn(`[Facade] 이상치 무시: ${currentSpeed.toFixed(1)}km/h`);
                return;
            }

            const ALPHA = 0.3;
            const prevEma = prevLocRef.current.emaSpeedKmh || 0;
            currentEma = (currentSpeed * ALPHA) + (prevEma * (1 - ALPHA));

            if (currentEma > 12 && currentEma <= 60 && confirmedModeRef.current !== 'bus') {
                newMode = 'bus';
            } else if (currentEma > 60 && confirmedModeRef.current !== 'train') {
                newMode = 'train';
            } else if (currentEma <= 12 && currentEma > 0 && confirmedModeRef.current !== 'walk') {
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
         confirmedMode: confirmedModeRef.current
     };

     addRoutePoint(point);
     prevLocRef.current = point;

     // 2km 단위로 관광 정보 속보 체크
     const distFromLastFetch = lastTourismFetchLoc.current
         ? getDistanceFromLatLonInKm(lastTourismFetchLoc.current.lat, lastTourismFetchLoc.current.lng, rawLoc.lat, rawLoc.lng)
         : 999;

     if (distFromLastFetch >= 2) {
         lastTourismFetchLoc.current = { lat: rawLoc.lat, lng: rawLoc.lng };
         fetch(`/api/tourism?lat=${rawLoc.lat}&lng=${rawLoc.lng}&radius=2000`)
           .then(res => res.json())
           .then(data => {
               if (data.items && data.items.length > 0) {
                   const randomItem = data.items[Math.floor(Math.random() * data.items.length)];
                   setTourismNews({
                       title: randomItem.title,
                       distance: parseInt(randomItem.dist)
                   });
               }
           })
           .catch(err => console.error('[Tourism Fetch Error]', err));
     }

  // Zustand setter들은 안정된 참조 → deps 변경 없이 callback이 한 번만 생성됨
  }, [setCurrentLocation, addRoutePoint, setDetectedMode, setTourismNews]);

  useEffect(() => {
    const adapter = adapterRef.current;
    
    adapter.startTracking(
      processNewLocation,
      (err) => {
         // Enum 기반 전역 예외 처리기로 전달
         GlobalExceptionHandler.handle(err);
      }
    );

    return () => {
      adapter.stopTracking();
    };
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
            // 기록 종료 시 '티켓 영수증' 모달 표출
            setShowTicketModal(true);
        }
    }
  };
}
