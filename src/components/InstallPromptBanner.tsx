'use client';

import { useEffect, useState } from 'react';
import { playClickSound } from '@/application/utils/audioUtils';
import { usePushNotification } from '@/application/hooks/usePushNotification';

export default function InstallPromptBanner() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { permission, isSubscribed, subscribe } = usePushNotification();

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsIOS(ios);
    setIsStandalone(standalone);
    setDismissed(!!localStorage.getItem('whereami_install_dismissed'));

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    playClickSound();
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleDismiss = () => {
    playClickSound();
    setDismissed(true);
    localStorage.setItem('whereami_install_dismissed', '1');
  };

  const handlePushSubscribe = async () => {
    playClickSound();
    await subscribe();
  };

  // 이미 설치된(standalone) 상태에서는 알림 권한만 안내
  if (isStandalone) {
    if (isSubscribed || permission === 'denied') return null;
    return (
      <div className="fixed bottom-24 left-3 right-3 z-40 bg-retro-cream border-retro-thick rounded-sm p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-start gap-3 animate-pixel-in">
        <span className="text-2xl shrink-0">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-retro-body-bold text-retro-wood">여정 알림 받기</p>
          <p className="text-retro-tiny text-retro-gray mt-0.5">모험 완료 시 알림을 보내드려요!</p>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={handlePushSubscribe} className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-tiny py-1 px-2">허용</button>
          <button onClick={handleDismiss} className="pixel-btn-3d pixel-btn-3d-sm is-cream text-retro-tiny py-1 px-2">✕</button>
        </div>
      </div>
    );
  }

  // 설치 유도 배너 (브라우저 모드)
  if (dismissed || (!installPrompt && !isIOS)) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-40 bg-retro-cream border-retro-thick rounded-sm p-3 shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-start gap-3 animate-pixel-in">
      <img src="/icons/banana_192.png" className="w-10 h-10 pixelated shrink-0 rounded-sm" alt="앱 아이콘" />
      <div className="flex-1 min-w-0">
        <p className="text-retro-body-bold text-retro-wood">홈 화면에 추가</p>
        {isIOS ? (
          <p className="text-retro-tiny text-retro-gray mt-0.5 leading-relaxed">
            Safari 하단 <b>공유(□↑)</b> → <b>홈 화면에 추가</b>
          </p>
        ) : (
          <p className="text-retro-tiny text-retro-gray mt-0.5">앱처럼 설치하고 오프라인에서도!</p>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {installPrompt && (
          <button onClick={handleInstall} className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-tiny py-1 px-2">설치</button>
        )}
        <button onClick={handleDismiss} className="pixel-btn-3d pixel-btn-3d-sm is-cream text-retro-tiny py-1 px-2">✕</button>
      </div>
    </div>
  );
}
