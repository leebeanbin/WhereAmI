import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import { CITY_CODE_REFRESH_DISTANCE_KM } from '../../constants/tracking';
import { FORCE_REFETCH_SENTINEL_KM } from '../../constants/math';
import type { ApiBody } from '../../lib/apiResponse';
import type { GeocodeDto } from '../dtos/StationDto';

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
      : FORCE_REFETCH_SENTINEL_KM;

    if (distFromLast < CITY_CODE_REFRESH_DISTANCE_KM) return;

    lastGeocodedLoc.current = currentLocation;

    fetch(`/api/geocode?lat=${currentLocation.lat}&lng=${currentLocation.lng}`)
      .then(res => res.json() as Promise<ApiBody<GeocodeDto>>)
      .then(body => { if (body.success) setCityCode(body.data.cityCode); })
      .catch(err => console.error('[useCityCode]', err));
  }, [currentLocation, setCityCode]);
}
