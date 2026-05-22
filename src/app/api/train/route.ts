import { AppError } from '@/domain/exceptions/AppError';
import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { TRAIN_PAGE_SIZE, TAGO_TRAIN_BASE_URL } from '@/constants/api';
import { TrainBuilder } from '@/application/builders/TrainBuilder';
import type { TrainRequestDto } from '@/application/dtos/requests';
import type { TrainDto } from '@/application/dtos/TransportDto';

/**
 * @swagger
 * /api/train:
 *   get:
 *     summary: 출발역 기준 열차 시간표 조회 (TAGO 열차정보 API)
 *     parameters:
 *       - in: query
 *         name: depStationName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: arrStationName
 *         schema:
 *           type: string
 *       - in: query
 *         name: depPlandTime
 *         schema:
 *           type: string
 *         description: 출발 예정일 (YYYYMMDD, 기본 오늘)
 *     responses:
 *       200:
 *         description: 열차 시간표 목록
 */
export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const depStationName = parser.requireString('depStationName');
  const arrStationName = parser.optionalString('arrStationName', '');
  const depPlandTime = parser.optionalString('depPlandTime', getTodayString());

  if (!depStationName) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'depStationName 파라미터가 필요합니다.');
  }

  const req: TrainRequestDto = { depStationName, arrStationName, depPlandTime };
  const apiKey = process.env.TAGO_API_KEY;

  if (!apiKey) {
    return ApiResponse.serverError(ErrorCode.API_UNAUTHORIZED, 'TAGO_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const params = new URLSearchParams({
      serviceKey: apiKey,
      numOfRows: String(TRAIN_PAGE_SIZE),
      pageNo: '1',
      _type: 'json',
      depPlaceName: req.depStationName,
      arrPlaceName: req.arrStationName,
      depPlandTime: req.depPlandTime,
    });

    const response = await fetch(`${TAGO_TRAIN_BASE_URL}/getStrtpntAlocFndTrainInfo?${params}`);

    if (!response.ok) {
      console.warn(`[Train API Warning] External Train API returned ${response.status}`);
      return ApiResponse.ok({
        items: [],
        warning: `열차 API 통신 오류 (${response.status})`
      });
    }

    const text = await response.text();

    if (!text.trim().startsWith('{')) {
      console.warn('[Train API Warning] External Train API returned non-JSON:', text);
      return ApiResponse.ok({
        items: [],
        warning: `열차 API 응답 형식 오류 (키 미승인 또는 서비스 점검 중: 403)`
      });
    }

    const body = JSON.parse(text);
    const items = body?.response?.body?.items?.item;

    if (!items) return ApiResponse.ok({ items: [] });

    const itemArray: Record<string, any>[] = Array.isArray(items) ? items : [items];
    return ApiResponse.ok({ items: TrainBuilder.fromRawList(itemArray) });
  } catch (error: any) {
    console.error('[Train API Error]', error);
    return ApiResponse.ok({
      items: [],
      warning: `열차 데이터 조회 실패: ${error.message}`
    });
  }
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}
