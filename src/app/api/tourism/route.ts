import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';
import { TOURISM_PAGE_SIZE, TOURISM_MOBILE_OS, TOURISM_APP_NAME, TOUR_API_BASE_URL } from '@/constants/api';
import { TOURISM_RADIUS_M } from '@/constants/tracking';
import { TourismBuilder } from '@/application/builders/TourismBuilder';
import type { TourismRequestDto } from '@/application/dtos/requests';
import type { TourismListDto } from '@/application/dtos/TourismDto';

export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const lat = parser.requireNumber('lat');
  const lng = parser.requireNumber('lng');
  const radius = parser.optionalNumber('radius', TOURISM_RADIUS_M);

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const req: TourismRequestDto = { lat, lng, radius };
  const apiKey = process.env.TOUR_API_KEY;

  if (!apiKey) {
    return ApiResponse.ok<TourismListDto>({ 
      items: [], 
      warning: 'TOUR_API_KEY가 설정되지 않았습니다.' 
    } as any);
  }

  try {
    const url = `${TOUR_API_BASE_URL}/locationBasedList1?serviceKey=${apiKey}&numOfRows=${TOURISM_PAGE_SIZE}&pageNo=1&MobileOS=${TOURISM_MOBILE_OS}&MobileApp=${TOURISM_APP_NAME}&_type=json&mapX=${req.lng}&mapY=${req.lat}&radius=${req.radius}`;
    const response = await fetch(url);

    // 외부 API 통신 응답 오류가 있는 경우
    if (!response.ok) {
      console.warn(`[Tourism API Warning] External TourAPI returned ${response.status}`);
      return ApiResponse.ok<TourismListDto>({ 
        items: [], 
        warning: `관광공사 API 서비스 통신 오류 (${response.status})` 
      } as any);
    }

    const text = await response.text();

    // 응답이 JSON 형식이 아닌 경우 (예: "Unexpected errors"와 같은 텍스트 반환 대응)
    if (!text.trim().startsWith('{')) {
      console.warn('[Tourism API Warning] External TourAPI returned non-JSON:', text);
      return ApiResponse.ok<TourismListDto>({
        items: [],
        warning: `관광공사 API 응답이 올바르지 않습니다. (키 미등록 또는 점검 중: ${text.slice(0, 50)})`
      } as any);
    }

    const body = JSON.parse(text);
    const items = body?.response?.body?.items?.item;

    if (!items || items.length === 0) {
      return ApiResponse.ok<TourismListDto>({ items: [] });
    }

    const itemArray: Record<string, any>[] = Array.isArray(items) ? items : [items];
    return ApiResponse.ok<TourismListDto>(TourismBuilder.fromRawList(itemArray));
  } catch (error: any) {
    console.error('[Tourism API Catch Error]', error);
    return ApiResponse.ok<TourismListDto>({ 
      items: [], 
      warning: `관광공사 데이터 조회 중 장애가 발생했습니다: ${error.message}` 
    } as any);
  }
}

