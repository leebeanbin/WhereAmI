import { useState, useCallback, useEffect } from 'react';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('whereami_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('whereami_device_id', id);
  }
  return id;
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
      setIsSubscribed(Notification.permission === 'granted' &&
        !!localStorage.getItem('whereami_push_subscribed'));
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return false;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const deviceId = getOrCreateDeviceId();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), deviceId }),
      });

      localStorage.setItem('whereami_push_subscribed', '1');
      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.warn('[usePushNotification] subscribe failed:', e);
      return false;
    }
  }, []);

  const sendPush = useCallback(async (title: string, body: string, url = '/') => {
    const deviceId = getOrCreateDeviceId();
    if (!deviceId || !isSubscribed) return;
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, title, body, url }),
      });
    } catch (e) {
      console.warn('[usePushNotification] sendPush failed:', e);
    }
  }, [isSubscribed]);

  return { permission, isSubscribed, subscribe, sendPush };
}
