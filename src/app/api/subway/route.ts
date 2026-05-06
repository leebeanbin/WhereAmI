import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/subway:
 *   get:
 *     summary: 서울 지하철 실시간 도착 정보 (서울 교통 공사 API)
 *     description: 서울 교통 공사 Open API를 BFF로 래핑합니다. 역 이름 기준으로 실시간 지하철 도착 정보를 반환합니다.
 *     parameters:
 *       - in: query
 *         name: stationName
 *         required: true
 *         schema:
 *           type: string
 *         description: 지하철 역 이름 (예: 강남, 홍대입구)
 *     responses:
 *       200:
 *         description: 실시간 도착 정보 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lineId:
 *                     type: string
 *                     example: "2"
 *                   trainLineNm:
 *                     type: string
 *                     example: "성수행 - 외선순환"
 *                   arvlMsg2:
 *                     type: string
 *                     example: "2분 후 (잠실나루)"
 *                   arvlMsg3:
 *                     type: string
 *                     example: "잠실나루"
 *                   arvlCd:
 *                     type: string
 *                     description: "도착 코드 (0:진입, 1:도착, 2:출발, 3:전역출발, 4:전전역출발)"
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서울 교통 공사 API 오류
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationName = searchParams.get('stationName');

  if (!stationName) {
    return NextResponse.json({ error: 'stationName 파라미터가 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.SEOUL_METRO_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'SEOUL_METRO_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const encodedStation = encodeURIComponent(stationName);
    const url = `http://swopenAPI.seoul.go.kr/api/subway/${apiKey}/json/realtimeStationArrival/0/10/${encodedStation}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`서울 교통 공사 API 오류: ${response.status}`);
    }

    const data = await response.json();

    if (data.errorMessage) {
      const code = data.errorMessage.code;
      if (code === 'INFO-200') {
        return NextResponse.json([]);
      }
      throw new Error(data.errorMessage.message);
    }

    const items: any[] = data?.realtimeStationArrival?.row ?? [];

    const arrivals = items.map((item: any) => ({
      lineId: item.subwayId,           // 호선 ID (1001=1호선, 1002=2호선 ...)
      trainLineNm: item.trainLineNm,   // 행선지 방향
      arvlMsg2: item.arvlMsg2,         // 도착 메시지 (n분 후)
      arvlMsg3: item.arvlMsg3,         // 현재 위치 (전역 이름)
      arvlCd: item.arvlCd,             // 도착 코드
      recptnDt: item.recptnDt,         // 정보 수신 시각
    }));

    return NextResponse.json(arrivals);
  } catch (error: any) {
    console.error('[Subway API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
