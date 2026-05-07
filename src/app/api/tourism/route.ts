import { NextResponse } from 'next/server';
import { TOURISM_PAGE_SIZE } from '@/constants/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '1000'; // 기본 반경 1km

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng 파라미터가 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.TOUR_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'TOUR_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    // 한국관광공사_국문 관광정보 서비스_GW - 위치기반 관광정보 조회
    const url = `http://apis.data.go.kr/B551011/KorService1/locationBasedList1?serviceKey=${apiKey}&numOfRows=${TOURISM_PAGE_SIZE}&pageNo=1&MobileOS=ETC&MobileApp=WhereAmI&_type=json&mapX=${lng}&mapY=${lat}&radius=${radius}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`관광공사 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    const items = data?.response?.body?.items?.item;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: '주변에 관광 정보가 없습니다.', items: [] });
    }

    const itemArray = Array.isArray(items) ? items : [items];
    
    // 데이터 정제
    const cleanedItems = itemArray.map((item: any) => ({
      title: item.title,
      address: item.addr1,
      dist: item.dist, // 미터 거리
      imageUrl: item.firstimage || null,
      mapX: item.mapx,
      mapY: item.mapy
    }));

    return NextResponse.json({ items: cleanedItems });

  } catch (error: any) {
    console.error('[Tourism API Error]', error);
    return NextResponse.json({ error: '관광 정보를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}
