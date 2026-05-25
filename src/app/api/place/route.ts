import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';

export interface PlaceInfoDto {
  name: string;
  address: string;
  roadAddress: string | null;
}

export async function GET(request: Request) {
  const parser = RequestParser.from(request);
  const lat = parser.requireNumber('lat');
  const lng = parser.requireNumber('lng');

  if (lat === null || lng === null) {
    return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'lat, lng 파라미터가 필요합니다.');
  }

  const restKey = process.env.KAKAO_REST_API_KEY;

  if (restKey) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
        { headers: { Authorization: `KakaoAK ${restKey}` } },
      );
      if (res.ok) {
        const body = await res.json();
        const doc = body.documents?.[0];
        if (doc) {
          const roadAddr = doc.road_address;
          const jibunAddr = doc.address;
          const buildingName = roadAddr?.building_name || null;
          const roadAddress = roadAddr?.address_name || null;
          const jibunAddress = jibunAddr?.address_name || null;
          return ApiResponse.ok<PlaceInfoDto>({
            name: buildingName || roadAddress || jibunAddress || '이 위치',
            address: jibunAddress || roadAddress || '주소 정보 없음',
            roadAddress,
          });
        }
      }
    } catch (e) {
      console.warn('[place] Kakao coord2address failed:', e);
    }
  }

  // Nominatim 폴백
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'WhereAmI-App/1.0' } },
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address ?? {};
      const name =
        data.namedetails?.name ||
        addr.amenity || addr.shop || addr.building ||
        addr.road || addr.suburb || addr.city ||
        '이 위치';
      const address = data.display_name?.split(', ').slice(0, 4).join(', ') || '주소 정보 없음';
      return ApiResponse.ok<PlaceInfoDto>({ name, address, roadAddress: null });
    }
  } catch (e) {
    console.warn('[place] Nominatim failed:', e);
  }

  return ApiResponse.ok<PlaceInfoDto>({
    name: '이 위치',
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    roadAddress: null,
  });
}
