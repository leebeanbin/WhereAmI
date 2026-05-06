import { NextResponse } from 'next/server';
import { AppError } from '@/domain/exceptions/AppError';
import { ErrorCode } from '@/constants/ResponseCodes';

const TAGO_TRAIN_BASE = 'http://apis.data.go.kr/1613000/TrainInfoService';

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
 *         description: 출발역 이름 (예: 서울, 부산)
 *       - in: query
 *         name: arrStationName
 *         required: false
 *         schema:
 *           type: string
 *         description: 도착역 이름
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
  const arrStationName = searchParams.get('arrStationName') || '';
  const depPlandTime = searchParams.get('depPlandTime') || getTodayString();

  if (!depStationName) {
    return NextResponse.json({ error: 'depStationName 파라미터가 필요합니다.' }, { status: 400 });
  }

  const apiKey = process.env.TAGO_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'TAGO_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams({
      serviceKey: apiKey,
      numOfRows: '10',
      pageNo: '1',
      _type: 'json',
      depPlaceName: depStationName,
      arrPlaceName: arrStationName,
      depPlandTime,
    });

    const url = `${TAGO_TRAIN_BASE}/getStrtpntAlocFndTrainInfo?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new AppError(ErrorCode.API_TIMEOUT, `TAGO 열차 API 오류: ${response.status}`);
    }

    const data = await response.json();
    const items = data?.response?.body?.items?.item;

    if (!items) {
      return NextResponse.json([]);
    }

    const itemArray = Array.isArray(items) ? items : [items];

    const trains = itemArray.map((item: any) => ({
      trainNo: item.trainNo,
      trainType: item.trainType,         // 1: KTX, 3: 새마을, 5: 무궁화 등
      trainTypeName: item.trainTypeName,
      depPlaceName: item.depPlaceName,
      arrPlaceName: item.arrPlaceName,
      depPlandTime: item.depPlandTime,   // YYYYMMDDHHMMSS
      arrPlandTime: item.arrPlandTime,
      adultCharge: item.adultCharge,
    }));

    return NextResponse.json(trains);
  } catch (error: any) {
    console.error('[Train API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}
