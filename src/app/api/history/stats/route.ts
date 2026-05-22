import { NextRequest } from 'next/server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Journey } from '@/domain/models/Journey';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';
import { DEFAULT_USER_ID, JOURNEYS_FETCH_LIMIT } from '@/constants/api';
import { DECIMAL_2_FACTOR } from '@/constants/math';
import type { HistoryStatsRequestDto } from '@/application/dtos/requests';
import type { JourneyStatsDto } from '@/application/dtos/StationDto';
import { activeSession } from '../../tracking/active/route';

/**
 * @swagger
 * /api/history/stats:
 *   get:
 *     summary: "사용자의 여정 통계 요약을 반환합니다."
 *     description: "iOS 위젯(WidgetKit) 등 경량 클라이언트가 사용하는 집계 엔드포인트입니다."
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "통계 집계 성공"
 */
export async function GET(req: NextRequest) {
  const dto: HistoryStatsRequestDto = {
    userId: req.nextUrl.searchParams.get('userId') ?? DEFAULT_USER_ID,
  };

  try {
    const q = query(
      collection(db, 'journeys'),
      where('userId', '==', dto.userId),
      where('status', '==', 'completed'),
      limit(JOURNEYS_FETCH_LIMIT)
    );
    const snap = await getDocs(q);
    const journeys = snap.docs.map(d => d.data() as Journey);

    const totalDistanceKm = journeys.reduce((s, j) => s + (j.totalDistanceKm ?? 0), 0);
    const totalDurationSec = journeys.reduce((s, j) => s + (j.totalDurationSec ?? 0), 0);

    const stats: JourneyStatsDto = {
      totalDistanceKm: Math.round(totalDistanceKm * DECIMAL_2_FACTOR) / DECIMAL_2_FACTOR,
      totalDurationSec,
      journeyCount: journeys.length,
      activeSession,
    };

    return ApiResponse.ok<JourneyStatsDto>(stats);
  } catch (error: any) {
    console.error('[history/stats]', error);
    return ApiResponse.serverError(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
