import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';

export interface RoutePointDto {
  lat: number;
  lng: number;
}

export interface RouteResultDto {
  points: RoutePointDto[];
  distanceM: number;
  durationSec: number;
}

export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const fromLat = parser.requireNumber('fromLat');
  const fromLng = parser.requireNumber('fromLng');
  const toLat = parser.requireNumber('toLat');
  const toLng = parser.requireNumber('toLng');

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'fromLat, fromLng, toLat, toLng 파라미터가 필요합니다.');
  }

  try {
    // OSRM 공개 보행자 경로 (routing.openstreetmap.de, foot profile)
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`OSRM responded with ${res.status}`);
    }

    const data = await res.json();
    const route = data.routes?.[0];

    if (!route) {
      return ApiResponse.ok<RouteResultDto>({ points: [], distanceM: 0, durationSec: 0 });
    }

    const coords: [number, number][] = route.geometry?.coordinates ?? [];
    const points: RoutePointDto[] = coords.map(([lng, lat]) => ({ lat, lng }));

    return ApiResponse.ok<RouteResultDto>({
      points,
      distanceM: Math.round(route.distance ?? 0),
      durationSec: Math.round(route.duration ?? 0),
    });
  } catch (error: any) {
    console.warn('[Route API] OSRM failed:', error.message);
    // 라우팅 실패 시 빈 배열 반환 — 클라이언트에서 직선으로 폴백
    return ApiResponse.ok<RouteResultDto>({ points: [], distanceM: 0, durationSec: 0 });
  }
}
