import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import { CITY_CODE_REFRESH_DISTANCE_KM } from '../../constants/tracking';

export function useCityCode() {
  const { currentLocation, setCityCode } = useLocationStore();
  const lastGeocodedLoc = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!currentLocation) return;

    const distFromLast = lastGeocodedLoc.current
      ? getDistanceFromLatLonInKm(
          lastGeocodedLoc.current.lat, lastGeocodedLoc.current.lng,
          currentLocation.lat, currentLocation.lng
        )
      : 999;

    if (distFromLast < CITY_CODE_REFRESH_DISTANCE_KM) return;

    lastGeocodedLoc.current = currentLocation;

    fetch(`/api/geocode?lat=${currentLocation.lat}&lng=${currentLocation.lng}`)
      .then(res => res.json())
      .then(data => { if (data.cityCode) setCityCode(data.cityCode); })
      .catch(err => console.error('[useCityCode]', err));
  }, [currentLocation, setCityCode]);
}
