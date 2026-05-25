import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import { zoomToStationRadius } from '../../constants/map';
import type { ApiBody } from '../../lib/apiResponse';
import type { StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';

export function useNearbyStations(zoomLevel: number) {
  const { currentLocation, nearbyStations, setNearbyStations } = useLocationStore();
  const lastFetchLoc = useRef<{ lat: number; lng: number } | null>(null);
  const lastZoomRef = useRef<number | null>(null);

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

    // 반경의 1/4 이상 이동하거나 줌이 변경된 경우 재조회
    if (distFromLast < radiusM / 4 && !zoomChanged && nearbyStations.length > 0) return;

    lastFetchLoc.current = { lat: currentLocation.lat, lng: currentLocation.lng };
    lastZoomRef.current = zoomLevel;

    fetch(`/api/stations?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=${radiusM}`)
      .then(res => res.json() as Promise<ApiBody<any>>)
      .then(body => {
        if (body.success) {
          const resData = body.data;
          if (Array.isArray(resData)) {
            setNearbyStations(resData);
          } else {
            setNearbyStations(resData.items || []);
          }
        }
      })
      .catch(err => console.error('[Stations]', err));
  }, [currentLocation, nearbyStations.length, setNearbyStations, zoomLevel]);
}
