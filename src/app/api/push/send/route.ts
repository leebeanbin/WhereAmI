import webpush from 'web-push';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ApiResponse } from '@/lib/apiResponse';
import { ErrorCode } from '@/constants/ResponseCodes';

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails('mailto:muzidea0808@gmail.com', vapidPublic, vapidPrivate);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function POST(request: Request) {
  if (!vapidPublic || !vapidPrivate) {
    return ApiResponse.serverError(ErrorCode.UNKNOWN_ERROR, 'VAPID 키가 설정되지 않았습니다.');
  }

  try {
    const { deviceId, title, body, url, tag } = await request.json();
    if (!deviceId) {
      return ApiResponse.badRequest(ErrorCode.UNKNOWN_ERROR, 'deviceId가 필요합니다.');
    }

    const snap = await getDoc(doc(db, 'push_subscriptions', deviceId));
    if (!snap.exists()) {
      return ApiResponse.ok({ sent: false, reason: 'no_subscription' });
    }

    const payload: PushPayload = { title, body, url: url ?? '/', tag: tag ?? 'whereami' };
    await webpush.sendNotification(snap.data().subscription, JSON.stringify(payload));

    return ApiResponse.ok({ sent: true });
  } catch (e: any) {
    // 구독 만료(410) 시 Firestore에서 삭제 필요 — 클라이언트가 재구독
    if (e.statusCode === 410) {
      return ApiResponse.ok({ sent: false, reason: 'subscription_expired' });
    }
    console.error('[push/send] failed:', e.message);
    return ApiResponse.serverError(ErrorCode.UNKNOWN_ERROR, `Push 전송 실패: ${e.message}`);
  }
}
