// Push 알림 수신 처리
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'WhereAmI', body: event.data.text(), url: '/' };
  }

  const options = {
    body: payload.body ?? '새로운 알림이 도착했습니다.',
    icon: '/icons/banana_192.png',
    badge: '/icons/banana_192.png',
    data: { url: payload.url ?? '/' },
    vibrate: [100, 50, 100],
    tag: payload.tag ?? 'whereami-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'WhereAmI', options)
  );
});

// 알림 탭 시 해당 URL로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        clients.openWindow(targetUrl);
      }
    })
  );
});
