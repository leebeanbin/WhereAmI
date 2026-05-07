import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { DEFAULT_CITY_CODE } from '@/constants/api';
import type { TransportRequestDto } from '@/application/dtos/requests';
import type { BusScheduleDto } from '@/application/dtos/TransportDto';

/**
 * @swagger
 * /api/transport:
 *   get:
 *     summary: 특정 정류장의 버스 도착 정보 조회 (TAGO BFF)
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cityCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 도착 정보 목록
 *       400:
 *         description: 파라미터 누락
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const stationId = parser.requireString('stationId');
  const cityCode = parser.optionalString('cityCode', DEFAULT_CITY_CODE);

  if (!stationId) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'stationId 파라미터가 필요합니다.');
  }

  const req: TransportRequestDto = { stationId, cityCode };
  const adapter = new TagoApiAdapter(process.env.TAGO_API_KEY ?? '');

  try {
    const data = await adapter.getArrivalInfo(req.stationId, req.cityCode);
    return ApiResponse.ok<BusScheduleDto[]>(data as BusScheduleDto[]);
  } catch (error: any) {
    console.error('[transport]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}
