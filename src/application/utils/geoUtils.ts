import { EARTH_RADIUS_KM, DEG_TO_RAD, METERS_PER_KM, SECONDS_PER_MINUTE } from '@/constants/math';

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * METERS_PER_KM)}m` : `${km.toFixed(2)}km`;
}

export function formatDuration(sec: number): string {
  if (sec < SECONDS_PER_MINUTE) return `${Math.floor(sec)}초`;
  const m = Math.floor(sec / SECONDS_PER_MINUTE);
  if (m < SECONDS_PER_MINUTE) return `${m}분 ${Math.floor(sec % SECONDS_PER_MINUTE)}초`;
  return `${Math.floor(m / SECONDS_PER_MINUTE)}시간 ${m % SECONDS_PER_MINUTE}분`;
}
