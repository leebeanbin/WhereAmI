import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import { STATION_REFETCH_DISTANCE_KM } from '../../constants/tracking';
import { FORCE_REFETCH_SENTINEL_KM } from '../../constants/math';
import type { ApiBody } from '../../lib/apiResponse';
import type { StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';

export function useNearbyStations() {
  const { currentLocation, nearbyStations, setNearbyStations } = useLocationStore();
  const lastFetchLoc = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!currentLocation) return;

    const distFromLast = lastFetchLoc.current
      ? getDistanceFromLatLonInKm(
          lastFetchLoc.current.lat, lastFetchLoc.current.lng,
          currentLocation.lat, currentLocation.lng
        )
      : FORCE_REFETCH_SENTINEL_KM;

    if (distFromLast < STATION_REFETCH_DISTANCE_KM && nearbyStations.length > 0) return;

    lastFetchLoc.current = currentLocation;

    fetch(`/api/stations?lat=${currentLocation.lat}&lng=${currentLocation.lng}`)
      .then(res => res.json() as Promise<ApiBody<StationInfo[]>>)
      .then(body => { if (body.success) setNearbyStations(body.data); })
      .catch(err => console.error('[Stations]', err));
  }, [currentLocation, nearbyStations.length, setNearbyStations]);
}
