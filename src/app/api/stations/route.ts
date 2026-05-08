import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { KAKAO_KEYWORD_SEARCH_URL, SUBWAY_SEARCH_RADIUS_M } from '@/constants/api';
import type { LatLngRequestDto } from '@/application/dtos/requests';
import type { StationDto } from '@/application/dtos/StationDto';
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

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const req: LatLngRequestDto = { lat, lng };
  const tagoAdapter = new TagoApiAdapter(process.env.TAGO_API_KEY ?? '');

  try {
    const [busStations, subwayStations] = await Promise.all([
      tagoAdapter.getNearbyStations(req.lat, req.lng),
      fetchNearbySubwayStations(req.lat, req.lng),
    ]);

    return ApiResponse.ok<StationDto[]>([...busStations, ...subwayStations]);
  } catch (error: any) {
    console.error('[stations]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}

async function fetchNearbySubwayStations(lat: number, lng: number): Promise<StationInfo[]> {
  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) return [];

  try {
    const params = new URLSearchParams({
      query: '지하철역',
      x: String(lng),
      y: String(lat),
      radius: String(SUBWAY_SEARCH_RADIUS_M),
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
