import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Journey } from '@/domain/models/Journey';
import { DEFAULT_USER_ID, JOURNEYS_FETCH_LIMIT } from '@/constants/api';
import { AppError } from '@/domain/exceptions/AppError';
import { ErrorCode } from '@/constants/ResponseCodes';

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
 *         description: "사용자 ID (미전달 시 anonymous 사용)"
 *     responses:
 *       200:
 *         description: "통계 집계 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDistanceKm:
 *                   type: number
 *                 totalDurationSec:
 *                   type: integer
 *                 journeyCount:
 *                   type: integer
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') ?? DEFAULT_USER_ID;

  try {
    const q = query(
      collection(db, 'journeys'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      limit(JOURNEYS_FETCH_LIMIT)
    );
    const snap = await getDocs(q);
    const journeys = snap.docs.map(d => d.data() as Journey);

    const totalDistanceKm = journeys.reduce((s, j) => s + (j.totalDistanceKm ?? 0), 0);
    const totalDurationSec = journeys.reduce((s, j) => s + (j.totalDurationSec ?? 0), 0);

    return NextResponse.json({
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      totalDurationSec,
      journeyCount: journeys.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '통계 조회 중 오류가 발생했습니다.';
    throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, message);
  }
}
