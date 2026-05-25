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

async function fetchWalkRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RouteResultDto> {
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return { points: [], distanceM: 0, durationSec: 0 };
  const coords: [number, number][] = route.geometry?.coordinates ?? [];
  return {
    points: coords.map(([lng, lat]) => ({ lat, lng })),
    distanceM: Math.round(route.distance ?? 0),
    durationSec: Math.round(route.duration ?? 0),
  };
}

async function fetchCarRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, restKey: string): Promise<RouteResultDto> {
  const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${fromLng},${fromLat}&destination=${toLng},${toLat}&priority=RECOMMEND`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'Authorization': `KakaoAK ${restKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Kakao Navi ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route || route.result_code !== 0) return { points: [], distanceM: 0, durationSec: 0 };

  const points: RoutePointDto[] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const vx: number[] = road.vertexes ?? [];
      for (let i = 0; i + 1 < vx.length; i += 2) {
        points.push({ lng: vx[i], lat: vx[i + 1] });
      }
    }
  }

  return {
    points,
    distanceM: Math.round(route.summary?.distance ?? 0),
    durationSec: Math.round(route.summary?.duration ?? 0),
  };
}

export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const fromLat = parser.requireNumber('fromLat');
  const fromLng = parser.requireNumber('fromLng');
  const toLat = parser.requireNumber('toLat');
  const toLng = parser.requireNumber('toLng');
  const mode = parser.optionalString('mode', 'walk');

  if (fromLat === null || fromLng === null || toLat === null || toLng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'fromLat, fromLng, toLat, toLng 파라미터가 필요합니다.');
  }

  try {
    if (mode === 'car') {
      const restKey = process.env.KAKAO_REST_API_KEY;
      if (!restKey) throw new Error('KAKAO_REST_API_KEY not set');
      const result = await fetchCarRoute(fromLat, fromLng, toLat, toLng, restKey);
      return ApiResponse.ok<RouteResultDto>(result);
    }

    const result = await fetchWalkRoute(fromLat, fromLng, toLat, toLng);
    return ApiResponse.ok<RouteResultDto>(result);
  } catch (error: any) {
    console.warn('[Route API] failed:', error.message);
    return ApiResponse.ok<RouteResultDto>({ points: [], distanceM: 0, durationSec: 0 });
  }
}
