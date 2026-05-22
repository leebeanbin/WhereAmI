import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { SUBWAY_PAGE_SIZE, SEOUL_METRO_API_URL, SEOUL_METRO_NO_DATA_CODE } from '@/constants/api';
import { SubwayArrivalBuilder } from '@/application/builders/SubwayArrivalBuilder';
import type { SubwayRequestDto } from '@/application/dtos/requests';
import type { SubwayArrivalDto } from '@/application/dtos/TransportDto';

/**
 * @swagger
 * /api/subway:
 *   get:
 *     summary: 서울 지하철 실시간 도착 정보 (서울 교통 공사 API)
 *     parameters:
 *       - in: query
 *         name: stationName
 *         required: true
 *         schema:
 *           type: string
 *         description: "지하철 역 이름 (예: 강남, 홍대입구)"
 *     responses:
 *       200:
 *         description: 실시간 도착 정보 목록
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서울 교통 공사 API 오류
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const stationName = parser.requireString('stationName');

  if (!stationName) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'stationName 파라미터가 필요합니다.');
  }

  const req: SubwayRequestDto = { stationName };
  const apiKey = process.env.SEOUL_METRO_API_KEY;

  if (!apiKey) {
    return ApiResponse.serverError(ErrorCode.API_UNAUTHORIZED, 'SEOUL_METRO_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const url = `${SEOUL_METRO_API_URL}/${apiKey}/json/realtimeStationArrival/0/${SUBWAY_PAGE_SIZE}/${encodeURIComponent(req.stationName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Subway API Warning] External Subway API returned ${response.status}`);
      return ApiResponse.ok({
        items: [],
        warning: `지하철 API 통신 오류 (${response.status})`
      });
    }

    const body = await response.json();

    if (body.errorMessage) {
      if (body.errorMessage.code === SEOUL_METRO_NO_DATA_CODE) {
        return ApiResponse.ok({ items: [] });
      }
      return ApiResponse.ok({
        items: [],
        warning: `지하철 API 경고: ${body.errorMessage.message}`
      });
    }

    const rows: Record<string, string>[] = body?.realtimeStationArrival?.row ?? [];
    return ApiResponse.ok({ items: SubwayArrivalBuilder.fromRawList(rows) });
  } catch (error: any) {
    console.error('[Subway API Error]', error);
    return ApiResponse.ok({
      items: [],
      warning: `지하철 데이터 조회 실패: ${error.message}`
    });
  }
}
