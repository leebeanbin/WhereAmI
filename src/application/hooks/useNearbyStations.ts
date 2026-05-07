import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';

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
      : 999;

    if (distFromLast < 0.5 && nearbyStations.length > 0) return;

    lastFetchLoc.current = currentLocation;

    fetch(`/api/stations?lat=${currentLocation.lat}&lng=${currentLocation.lng}`)
      .then(res => res.json())
      .then(data => { if (!data.error) setNearbyStations(data); })
      .catch(err => console.error('[Stations]', err));
  }, [currentLocation, nearbyStations.length, setNearbyStations]);
}
