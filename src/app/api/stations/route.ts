import { NextResponse } from 'next/server';
import { TagoApiAdapter } from '@/infrastructure/adapters/TagoApiAdapter';

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: 좌표 기반 주변 정류장 목록 조회
 *     description: 위경도를 기반으로 반경 내의 정류장(버스 등) 목록을 반환합니다.
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
 *         description: 주변 정류장 목록
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat, lng 파라미터가 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.TAGO_API_KEY || '';
  const adapter = new TagoApiAdapter(apiKey);

  try {
    const data = await adapter.getNearbyStations(parseFloat(lat), parseFloat(lng));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
