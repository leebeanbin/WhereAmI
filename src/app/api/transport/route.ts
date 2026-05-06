import { NextResponse } from 'next/server';
import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';

/**
 * @swagger
 * /api/transport:
 *   get:
 *     summary: 특정 정류장의 버스/기차 도착 정보를 조회합니다.
 *     description: 프론트엔드가 외부 API를 직접 호출하지 않도록(CORS 방지 등) 국토교통부 TAGO API를 내부적으로 호출하여 가공된 데이터를 반환합니다 (BFF 패턴).
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 정류장 또는 역의 고유 ID
 *     responses:
 *       200:
 *         description: 성공적으로 도착 정보를 조회함
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vehicleId:
 *                     type: string
 *                     example: "서울74사1234"
 *                   lineNo:
 *                     type: string
 *                     example: "143"
 *                   estimatedArrivalTime:
 *                     type: string
 *                     example: "2026-05-04T14:00:00Z"
 *                   currentStop:
 *                     type: string
 *                     example: "강남역"
 *       400:
 *         description: 잘못된 요청 (파라미터 누락)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId');
  const cityCode = searchParams.get('cityCode') || '25'; // 기본 대전

  if (!stationId) {
    return NextResponse.json({ error: 'stationId 파라미터가 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.TAGO_API_KEY || '';
  const adapter = new TagoApiAdapter(apiKey);

  try {
    const data = await adapter.getArrivalInfo(stationId, cityCode);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
