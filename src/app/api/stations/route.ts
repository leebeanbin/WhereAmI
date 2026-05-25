import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { KAKAO_KEYWORD_SEARCH_URL } from '@/constants/api';
import { getDistanceFromLatLonInKm } from '@/application/utils/geoUtils';
import type { LatLngRequestDto } from '@/application/dtos/requests';
import type { StationInfo } from '@/domain/interfaces/IPublicTransportAdapter';

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: 좌표 기반 주변 버스+지하철 정류장 목록 조회
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: 주변 버스 및 지하철 정류장 목록
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const lat = parser.requireNumber('lat');
  const lng = parser.requireNumber('lng');
  const radius = parser.optionalNumber('radius', 400);

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const req: LatLngRequestDto = { lat, lng };
  const tagoAdapter = new TagoApiAdapter(process.env.TAGO_API_KEY ?? '');

  try {
    let busStations: any[] = [];
    let subwayStations: any[] = [];
    let warning: string | undefined = undefined;

    try {
      const all = await tagoAdapter.getNearbyStations(req.lat, req.lng);
      busStations = all.filter(s =>
        getDistanceFromLatLonInKm(req.lat, req.lng, s.lat, s.lng) * 1000 <= (radius ?? 400)
      );
    } catch (busError: any) {
      console.warn('[stations] Bus stations query failed:', busError);
      warning = '주변 버스 정류장 데이터 조회 실패 (서비스 미승인 또는 점검 중)';
    }

    try {
      subwayStations = await fetchNearbySubwayStations(req.lat, req.lng, radius ?? 400);
    } catch (subwayError: any) {
      console.warn('[stations] Subway stations query failed:', subwayError);
      warning = warning 
        ? `${warning} / 지하철 정류장 조회 실패`
        : '주변 지하철 정류장 데이터 조회 실패';
    }

    return ApiResponse.ok({ items: [...busStations, ...subwayStations], warning });
  } catch (error: any) {
    console.error('[stations]', error);
    return ApiResponse.ok({
      items: [],
      warning: `주변 정류장 조회 실패: ${error.message}`
    });
  }
}

async function fetchNearbySubwayStations(lat: number, lng: number, radius: number): Promise<StationInfo[]> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return [];

  try {
    const params = new URLSearchParams({
      query: '지하철역',
      x: String(lng),
      y: String(lat),
      radius: String(radius),
      size: '15',
    });

    const response = await fetch(`${KAKAO_KEYWORD_SEARCH_URL}?${params}`, {
      headers: { Authorization: `KakaoAK ${restKey}` },
    });

    if (!response.ok) return [];

    const body = await response.json();
    const documents: Record<string, string>[] = body.documents ?? [];

    return documents.map((doc) => ({
      stationId: `kakao-${doc.id}`,
      stationName: doc.place_name,
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      type: 'subway' as const,
    }));
  } catch {
    return [];
  }
}
