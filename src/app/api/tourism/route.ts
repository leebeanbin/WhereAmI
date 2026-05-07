import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { TOURISM_PAGE_SIZE, TOURISM_MOBILE_OS, TOURISM_APP_NAME, TOUR_API_BASE_URL } from '@/constants/api';
import { TOURISM_RADIUS_M } from '@/constants/tracking';
import { TourismBuilder } from '@/application/builders/TourismBuilder';
import type { TourismListDto } from '@/application/dtos/TourismDto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? String(TOURISM_RADIUS_M);

  if (!lat || !lng) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const apiKey = process.env.TOUR_API_KEY;
  if (!apiKey) {
    return ApiResponse.serverError(ErrorCode.API_UNAUTHORIZED, 'TOUR_API_KEY가 설정되지 않았습니다.');
  }

  try {
    const url = `${TOUR_API_BASE_URL}/locationBasedList1?serviceKey=${apiKey}&numOfRows=${TOURISM_PAGE_SIZE}&pageNo=1&MobileOS=${TOURISM_MOBILE_OS}&MobileApp=${TOURISM_APP_NAME}&_type=json&mapX=${lng}&mapY=${lat}&radius=${radius}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`관광공사 API 응답 오류: ${response.status}`);

    const body = await response.json();
    const items = body?.response?.body?.items?.item;

    if (!items || items.length === 0) {
      return ApiResponse.ok<TourismListDto>({ items: [] });
    }

    const itemArray: Record<string, any>[] = Array.isArray(items) ? items : [items];
    return ApiResponse.ok<TourismListDto>(TourismBuilder.fromRawList(itemArray));
  } catch (error: any) {
    console.error('[Tourism API Error]', error);
    return ApiResponse.serverError(ErrorCode.API_TIMEOUT, error.message);
  }
}
