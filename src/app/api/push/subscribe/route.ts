import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';

export async function POST(request: Request) {
  try {
    const { subscription, deviceId } = await request.json();
    if (!subscription || !deviceId) {
      return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'subscription, deviceId가 필요합니다.');
    }
    await setDoc(doc(db, 'push_subscriptions', deviceId), {
      subscription,
      updatedAt: serverTimestamp(),
    });
    return ApiResponse.ok({ saved: true });
  } catch (e: any) {
    console.error('[push/subscribe] POST failed:', e.message);
    return ApiResponse.serverError(ErrorCode.UNKNOWN_ERROR, '구독 저장 실패');
  }
}

export async function DELETE(request: Request) {
  try {
    const { deviceId } = await request.json();
    if (!deviceId) {
      return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'deviceId가 필요합니다.');
    }
    await deleteDoc(doc(db, 'push_subscriptions', deviceId));
    return ApiResponse.ok({ deleted: true });
  } catch (e: any) {
    console.error('[push/subscribe] DELETE failed:', e.message);
    return ApiResponse.serverError(ErrorCode.UNKNOWN_ERROR, '구독 삭제 실패');
  }
}
