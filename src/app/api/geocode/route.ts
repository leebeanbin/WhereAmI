import { NextResponse } from 'next/server';
import { mapRegionToCityCode } from '@/application/utils/cityCodeMapper';
import { DEFAULT_CITY_CODE } from '@/constants/api';

/**
 * @swagger
 * /api/geocode:
 *   get:
 *     summary: 좌표 → 도시 코드 변환 (Kakao REST API)
 *     description: |
 *       위경도를 받아 TAGO cityCode를 반환하는 서버사이드 지오코딩 엔드포인트.
 *       웹·모바일·위젯 모든 클라이언트가 공통으로 호출합니다.
 *       환경변수 KAKAO_REST_API_KEY 필요 (Kakao Developers 콘솔 > REST API 키).
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
 *         description: "{ cityCode: string, regionName: string }"
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng 파라미터가 필요합니다.' }, { status: 400 });
  }

  const restKey = process.env.KAKAO_REST_API_KEY;
  if (!restKey) {
    // REST 키 미설정 시 기본 도시 코드(대전)로 graceful fallback
    console.warn('[Geocode] KAKAO_REST_API_KEY 미설정 — 기본값(대전, 25) 반환');
    return NextResponse.json({ cityCode: DEFAULT_CITY_CODE, regionName: '대전광역시' });
  }

  try {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`;
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${restKey}` },
    });

    if (!response.ok) throw new Error(`Kakao API 오류: ${response.status}`);

    const data = await response.json();
    const regionName: string = data.documents?.[0]?.region_1depth_name ?? '대전광역시';
    const cityCode = mapRegionToCityCode(regionName);

    return NextResponse.json({ cityCode, regionName });
  } catch (error: any) {
    console.error('[Geocode API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
