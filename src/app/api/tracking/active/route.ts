import { NextRequest } from 'next/server';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';

const SESSION_DOC_REF = () => doc(db, 'settings', 'activeSession');

const DEFAULT_SESSION = { isTracking: false, speedKmh: 0, mode: '도보 🚶' };

// Firebase 미설정 시 단일 인스턴스 내 메모리 폴백
let memoryFallback = { ...DEFAULT_SESSION };

/**
 * @swagger
 * /api/tracking/active:
 *   get:
 *     summary: "현재 활성화된 모험(속도 및 이동수단) 세션을 조회합니다."
 *     description: "iOS Widget/Live Activity가 현재 실시간 모험 상태를 폴링하기 위해 호출합니다."
 *     responses:
 *       200:
 *         description: "조회 성공"
 *   post:
 *     summary: "현재 실시간 모험 상태(속도, 이동수단)를 서버에 업데이트합니다."
 *     responses:
 *       200:
 *         description: "업데이트 성공"
 */
export async function GET() {
  try {
    const snap = await getDoc(SESSION_DOC_REF());
    return ApiResponse.ok(snap.exists() ? snap.data() : DEFAULT_SESSION);
  } catch {
    return ApiResponse.ok(memoryFallback);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = {
      isTracking: body.isTracking ?? false,
      speedKmh: body.speedKmh ?? 0,
      mode: body.mode ?? '도보 🚶',
    };
    memoryFallback = session;
    try {
      await setDoc(SESSION_DOC_REF(), { ...session, updatedAt: serverTimestamp() });
    } catch { /* Firebase 미설정 시 메모리에만 저장 */ }
    return ApiResponse.ok(session);
  } catch (error: any) {
    return ApiResponse.serverError(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
