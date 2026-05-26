import { ApiResponse } from '@/lib/apiResponse';
import { RequestParser } from '@/lib/requestParser';
import { ErrorCode } from '@/constants/ResponseCodes';

export interface PlaceInfoDto {
  name: string;
  address: string;
  roadAddress: string | null;
  category: string | null;
  categoryCode: string | null;
  phone: string | null;
  placeUrl: string | null;
  placeId: string | null;
}

const FACILITY_CODES = ['CS2', 'CE7', 'FD6', 'HP8', 'PM9', 'BK9', 'SW8', 'AT4', 'CT1'];

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
      const headers = { Authorization: `KakaoAK ${restKey}` };

      // coord2address + 카테고리별 시설 검색 동시 실행
      const [addrResult, ...catResults] = await Promise.all([
        fetch(
          `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
          { headers },
        )
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),

        ...FACILITY_CODES.map(code =>
          fetch(
            `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${code}&x=${lng}&y=${lat}&radius=50&size=5`,
            { headers },
          )
            .then(r => r.ok ? r.json() : { documents: [] })
            .catch(() => ({ documents: [] })),
        ),
      ]);

      // 주소 정보 파싱
      let buildingName: string | null = null;
      let roadAddress: string | null = null;
      let jibunAddress: string | null = null;

      const addrDoc = addrResult?.documents?.[0];
      if (addrDoc) {
        buildingName = addrDoc.road_address?.building_name || null;
        roadAddress = addrDoc.road_address?.address_name || null;
        jibunAddress = addrDoc.address?.address_name || null;
      }

      // 탭 좌표 50m 이내 가장 가까운 시설 선택
      const best = catResults
        .flatMap(b => (b?.documents ?? []) as any[])
        .filter((d: any) => Number(d.distance) <= 50)
        .sort((a: any, b: any) => Number(a.distance) - Number(b.distance))[0] ?? null;

      let placeName: string | null = null;
      let category: string | null = null;
      let categoryCode: string | null = null;
      let phone: string | null = null;
      let placeUrl: string | null = null;
      let placeId: string | null = null;

      if (best) {
        placeName = best.place_name || null;
        category = best.category_group_name || best.category_name?.split(' > ')[0] || null;
        categoryCode = best.category_group_code || null;
        phone = best.phone || null;
        placeUrl = best.place_url || null;
        placeId = best.id || null;
      }

      const name = placeName || buildingName || roadAddress || jibunAddress || '이 위치';

      return ApiResponse.ok<PlaceInfoDto>({
        name,
        address: jibunAddress || roadAddress || '주소 정보 없음',
        roadAddress,
        category,
        categoryCode,
        phone,
        placeUrl,
        placeId,
      });
    } catch (e) {
      console.warn('[place] Kakao API failed:', e);
    }
  }

  // Nominatim 폴백 (API 키 없는 환경)
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
      return ApiResponse.ok<PlaceInfoDto>({ name, address, roadAddress: null, category: null, categoryCode: null, phone: null, placeUrl: null, placeId: null });
    }
  } catch (e) {
    console.warn('[place] Nominatim failed:', e);
  }

  return ApiResponse.ok<PlaceInfoDto>({
    name: '이 위치',
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    roadAddress: null,
    category: null,
    categoryCode: null,
    phone: null,
    placeUrl: null,
    placeId: null,
  });
}
