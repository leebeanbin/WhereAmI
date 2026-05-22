import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';

// 로컬 개발/데모를 위한 메모리 내 활성 세션 상태 저장소
export let activeSession = {
  isTracking: false,
  speedKmh: 0,
  mode: '도보 🚶',
};

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
  return ApiResponse.ok(activeSession);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    activeSession = {
      isTracking: body.isTracking ?? false,
      speedKmh: body.speedKmh ?? 0,
      mode: body.mode ?? '도보 🚶',
    };
    return ApiResponse.ok(activeSession);
  } catch (error: any) {
    return ApiResponse.serverError(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
  }
}
