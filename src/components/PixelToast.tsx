'use client';

import { useEffect } from 'react';
import { useLocationStore } from '@/store/useLocationStore';

const AUTO_DISMISS_MS = 3500;

export default function PixelToast() {
  const { toast, setToast } = useLocationStore();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[110] w-11/12 max-w-xs animate-slide-up pointer-events-none">
      <div className={`nes-container is-rounded font-neodgm shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-4 !py-2 !px-3 ${
        isError
          ? 'bg-red-50 border-red-500 text-red-700'
          : 'bg-green-50 border-green-500 text-green-700'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{isError ? '💦' : '✨'}</span>
          <p className="text-xs leading-snug">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
