import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import type { LatLngRequestDto } from '@/application/dtos/requests';
import type { StationDto } from '@/application/dtos/StationDto';

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: 좌표 기반 주변 정류장 목록 조회
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
 *         description: 주변 정류장 목록
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const lat = parser.requireNumber('lat');
  const lng = parser.requireNumber('lng');

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const req: LatLngRequestDto = { lat, lng };
  const adapter = new TagoApiAdapter(process.env.TAGO_API_KEY ?? '');

  try {
    const data = await adapter.getNearbyStations(req.lat, req.lng);
    return ApiResponse.ok<StationDto[]>(data);
  } catch (error: any) {
    console.error('[stations]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}
