import { mapRegionToCityCode } from '@/application/utils/cityCodeMapper';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { DEFAULT_CITY_CODE, DEFAULT_REGION_NAME, KAKAO_LOCAL_API_URL } from '@/constants/api';
import type { LatLngRequestDto } from '@/application/dtos/requests';
import type { GeocodeDto } from '@/application/dtos/StationDto';

/**
 * @swagger
 * /api/geocode:
 *   get:
 *     summary: 좌표 → 도시 코드 변환 (Kakao REST API)
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
 *         description: "{ success: true, data: { cityCode, regionName } }"
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const lat = parser.requireNumber('lat');
  const lng = parser.requireNumber('lng');

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const req: LatLngRequestDto = { lat, lng };
  const restKey = process.env.KAKAO_REST_API_KEY;

  if (restKey) {
    try {
      const response = await fetch(`${KAKAO_LOCAL_API_URL}?x=${req.lng}&y=${req.lat}`, {
        headers: { Authorization: `KakaoAK ${restKey}` },
      });
      if (!response.ok) throw new Error(`Kakao API 오류: ${response.status}`);
      const body = await response.json();
      const regionName: string = body.documents?.[0]?.region_1depth_name ?? DEFAULT_REGION_NAME;
      return ApiResponse.ok<GeocodeDto>({ cityCode: mapRegionToCityCode(regionName), regionName });
    } catch (error: any) {
      console.error('[Geocode Kakao Error]', error);
    }
  }

  // Kakao 키 없거나 실패 시 → OpenStreetMap Nominatim(무료, 키 불필요)으로 폴백
  try {
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${req.lat}&lon=${req.lng}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'WhereAmI-App/1.0' } }
    );
    if (nominatimRes.ok) {
      const nominatim = await nominatimRes.json();
      const regionName: string =
        nominatim.address?.province ??
        nominatim.address?.state ??
        nominatim.address?.city ??
        DEFAULT_REGION_NAME;
      const cityCode = mapRegionToCityCode(regionName);
      console.info(`[Geocode] Nominatim 폴백 성공: ${regionName} → cityCode ${cityCode}`);
      return ApiResponse.ok<GeocodeDto>({ cityCode, regionName });
    }
  } catch (err) {
    console.warn('[Geocode] Nominatim 폴백 실패:', err);
  }

  return ApiResponse.ok<GeocodeDto>({ cityCode: DEFAULT_CITY_CODE, regionName: DEFAULT_REGION_NAME });
}
