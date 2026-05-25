import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../store/useLocationStore';
import { getDistanceFromLatLonInKm } from '../utils/geoUtils';
import type { ApiBody } from '../../lib/apiResponse';
import type { RouteResultDto } from '../../app/api/route/route';
import type { NavigationTarget } from '../../store/useLocationStore';

const REROUTE_THRESHOLD_M = 50;

export function useNavigationRoute() {
  const { navigationTarget, currentLocation, setNavigationRoute } = useLocationStore();
  const lastFetchLocRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevTargetRef = useRef<NavigationTarget | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!navigationTarget || !currentLocation) {
      abortRef.current?.abort();
      setNavigationRoute(null);
      lastFetchLocRef.current = null;
      prevTargetRef.current = null;
      return;
    }

    // 목적지가 바뀌면 위치 캐시 초기화 → 반드시 재요청
    if (prevTargetRef.current !== navigationTarget) {
      lastFetchLocRef.current = null;
      prevTargetRef.current = navigationTarget;
    }

    const distFromLast = lastFetchLocRef.current
      ? getDistanceFromLatLonInKm(
          lastFetchLocRef.current.lat, lastFetchLocRef.current.lng,
          currentLocation.lat, currentLocation.lng,
        ) * 1000
      : Infinity;

    if (distFromLast < REROUTE_THRESHOLD_M) return;

    lastFetchLocRef.current = { lat: currentLocation.lat, lng: currentLocation.lng };

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    fetch(
      `/api/route?fromLat=${currentLocation.lat}&fromLng=${currentLocation.lng}&toLat=${navigationTarget.lat}&toLng=${navigationTarget.lng}`,
      { signal: ctrl.signal },
    )
      .then(res => res.json() as Promise<ApiBody<RouteResultDto>>)
      .then(body => {
        if (body.success && body.data.points.length > 1) {
          setNavigationRoute(body.data.points);
        }
      })
      .catch(() => {});
  }, [navigationTarget, currentLocation, setNavigationRoute]);
}
