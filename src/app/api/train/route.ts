import { AppError } from '@/domain/exceptions/AppError';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { TRAIN_PAGE_SIZE, TAGO_TRAIN_BASE_URL } from '@/constants/api';
import { TrainBuilder } from '@/application/builders/TrainBuilder';
import type { TrainDto } from '@/application/dtos/TransportDto';

/**
 * @swagger
 * /api/train:
 *   get:
 *     summary: 출발역 기준 열차 시간표 조회 (TAGO 열차정보 API)
 *     description: 국토교통부 TAGO 열차정보 API를 BFF로 래핑합니다. KTX/ITX/무궁화 등 전국 철도 시간표를 조회합니다.
 *     parameters:
 *       - in: query
 *         name: depStationName
 *         required: true
 *         schema:
 *           type: string
 *         description: "출발역 이름 (예: 서울, 부산)"
 *       - in: query
 *         name: arrStationName
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: depPlandTime
 *         required: false
 *         schema:
 *           type: string
 *         description: 출발 예정일 (YYYYMMDD, 기본 오늘)
 *     responses:
 *       200:
 *         description: 열차 시간표 목록
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const depStationName = searchParams.get('depStationName');
  const arrStationName = searchParams.get('arrStationName') ?? '';
  const depPlandTime = searchParams.get('depPlandTime') ?? getTodayString();

  if (!depStationName) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'depStationName 파라미터가 필요합니다.');
  }

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
      depPlaceName: depStationName,
      arrPlaceName: arrStationName,
      depPlandTime,
    });

    const response = await fetch(`${TAGO_TRAIN_BASE_URL}/getStrtpntAlocFndTrainInfo?${params}`);

    if (!response.ok) {
      throw new AppError(ErrorCode.API_TIMEOUT, `TAGO 열차 API 오류: ${response.status}`);
    }

    const body = await response.json();
    const items = body?.response?.body?.items?.item;

    if (!items) return ApiResponse.ok<TrainDto[]>([]);

    const itemArray: Record<string, any>[] = Array.isArray(items) ? items : [items];
    return ApiResponse.ok<TrainDto[]>(TrainBuilder.fromRawList(itemArray));
  } catch (error: any) {
    console.error('[Train API Error]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}
