import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { DEFAULT_CITY_CODE } from '@/constants/api';

/**
 * @swagger
 * /api/transport:
 *   get:
 *     summary: 특정 정류장의 버스/기차 도착 정보를 조회합니다.
 *     description: 프론트엔드가 외부 API를 직접 호출하지 않도록(CORS 방지 등) 국토교통부 TAGO API를 내부적으로 호출하여 가공된 데이터를 반환합니다 (BFF 패턴).
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 정류장 또는 역의 고유 ID
 *     responses:
 *       200:
 *         description: 성공적으로 도착 정보를 조회함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       400:
 *         description: 잘못된 요청 (파라미터 누락)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');
  const cityCode = searchParams.get('cityCode') ?? DEFAULT_CITY_CODE;

  if (!stationId) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'stationId 파라미터가 필요합니다.');
  }

  const adapter = new TagoApiAdapter(process.env.TAGO_API_KEY ?? '');

  try {
    const data = await adapter.getArrivalInfo(stationId, cityCode);
    return ApiResponse.ok(data);
  } catch (error: any) {
    console.error('[transport]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}
