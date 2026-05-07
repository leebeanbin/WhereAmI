import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { SUBWAY_PAGE_SIZE, SEOUL_METRO_API_URL, SEOUL_METRO_NO_DATA_CODE } from '@/constants/api';

/**
 * @swagger
 * /api/subway:
 *   get:
 *     summary: 서울 지하철 실시간 도착 정보 (서울 교통 공사 API)
 *     description: 서울 교통 공사 Open API를 BFF로 래핑합니다. 역 이름 기준으로 실시간 지하철 도착 정보를 반환합니다.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lineId:
 *                         type: string
 *                         example: "2"
 *                       trainLineNm:
 *                         type: string
 *                         example: "성수행 - 외선순환"
 *                       arvlMsg2:
 *                         type: string
 *                         example: "2분 후 (잠실나루)"
 *                       arvlMsg3:
 *                         type: string
 *                         example: "잠실나루"
 *                       arvlCd:
 *                         type: string
 *                         description: "도착 코드 (0:진입, 1:도착, 2:출발, 3:전역출발, 4:전전역출발)"
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서울 교통 공사 API 오류
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationName = searchParams.get('stationName');

  if (!stationName) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'stationName 파라미터가 필요합니다.');
  }

  const apiKey = process.env.SEOUL_METRO_API_KEY;
  if (!apiKey) {
    return ApiResponse.serverError(ErrorCode.API_UNAUTHORIZED, 'SEOUL_METRO_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const url = `${SEOUL_METRO_API_URL}/${apiKey}/json/realtimeStationArrival/0/${SUBWAY_PAGE_SIZE}/${encodeURIComponent(stationName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`서울 교통 공사 API 오류: ${response.status}`);
    }

    const body = await response.json();

    if (body.errorMessage) {
      if (body.errorMessage.code === SEOUL_METRO_NO_DATA_CODE) {
        return ApiResponse.ok([]);
      }
      throw new Error(body.errorMessage.message);
    }

    const items: any[] = body?.realtimeStationArrival?.row ?? [];
    const arrivals = items.map((item: any) => ({
      lineId: item.subwayId,
      trainLineNm: item.trainLineNm,
      arvlMsg2: item.arvlMsg2,
      arvlMsg3: item.arvlMsg3,
      arvlCd: item.arvlCd,
      recptnDt: item.recptnDt,
    }));

    return ApiResponse.ok(arrivals);
  } catch (error: any) {
    console.error('[Subway API Error]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}
