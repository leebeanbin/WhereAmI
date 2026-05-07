import { mapRegionToCityCode } from '@/application/utils/cityCodeMapper';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { DEFAULT_CITY_CODE, DEFAULT_REGION_NAME, KAKAO_LOCAL_API_URL } from '@/constants/api';

/**
 * @swagger
 * /api/geocode:
 *   get:
 *     summary: 좌표 → 도시 코드 변환 (Kakao REST API)
 *     description: |
 *       위경도를 받아 TAGO cityCode를 반환하는 서버사이드 지오코딩 엔드포인트.
 *       웹·모바일·위젯 모든 클라이언트가 공통으로 호출합니다.
 *       환경변수 KAKAO_REST_API_KEY 필요 (Kakao Developers 콘솔 > REST API 키).
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
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) {
    console.warn('[Geocode] KAKAO_REST_API_KEY 미설정 — 기본값 반환');
    return ApiResponse.ok({ cityCode: DEFAULT_CITY_CODE, regionName: DEFAULT_REGION_NAME });
  }

  try {
    const url = `${KAKAO_LOCAL_API_URL}?x=${lng}&y=${lat}`;
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restKey}` },
    });

    if (!response.ok) throw new Error(`Kakao API 오류: ${response.status}`);

    const body = await response.json();
    const regionName: string = body.documents?.[0]?.region_1depth_name ?? DEFAULT_REGION_NAME;
    const cityCode = mapRegionToCityCode(regionName);

    return ApiResponse.ok({ cityCode, regionName });
  } catch (error: any) {
    console.error('[Geocode API Error]', error);
    return ApiResponse.serverError(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
