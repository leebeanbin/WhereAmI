import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import { zoomToStationRadius } from '../../constants/map';
import type { ApiBody } from '../../lib/apiResponse';
import type { StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';

export function useNearbyStations(zoomLevel: number) {
  const { currentLocation, setNearbyStations } = useLocationStore();
  const lastFetchLoc = useRef<{ lat: number; lng: number } | null>(null);
  const lastZoomRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!currentLocation) return;

    const radiusM = zoomToStationRadius(zoomLevel);
    const zoomChanged = lastZoomRef.current !== zoomLevel;

    const distFromLast = lastFetchLoc.current
      ? getDistanceFromLatLonInKm(
          lastFetchLoc.current.lat, lastFetchLoc.current.lng,
          currentLocation.lat, currentLocation.lng
        ) * 1000
      : Infinity;

    // 반경의 1/4 이상 이동하거나 줌이 변경된 경우만 재조회
    if (distFromLast < radiusM / 4 && !zoomChanged) return;

    lastFetchLoc.current = { lat: currentLocation.lat, lng: currentLocation.lng };
    lastZoomRef.current = zoomLevel;

    // 진행 중인 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(`/api/stations?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=${radiusM}`, {
      signal: ctrl.signal,
    })
      .then(res => res.json() as Promise<ApiBody<any>>)
      .then(body => {
        if (body.success) {
          const resData = body.data;
          setNearbyStations(Array.isArray(resData) ? resData : (resData.items ?? []));
        }
      })
      .catch(err => { if (err.name !== 'AbortError') console.error('[Stations]', err); });
  }, [currentLocation, setNearbyStations, zoomLevel]);
}
