'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { TOAST_DISMISS_MS } from '@/constants/api';

export default function PixelToast() {
  const { toast, setToast } = useLocationStore();
  const [toastToRender, setToastToRender] = useState(toast);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast) {
      setToastToRender(toast);
      setIsExiting(false);
    } else if (toastToRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setToastToRender(null);
        setIsExiting(false);
      }, 350); // slide-up-toast-out 지속 시간과 일치
      return () => clearTimeout(timer);
    }
  }, [toast, toastToRender]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  if (!toastToRender) return null;

  const isError = toastToRender.type === 'error';

  return (
    <div className="fixed top-4 inset-x-0 z-[120] flex justify-center pointer-events-none">
      <div 
        className={`w-11/12 max-w-xs pointer-events-auto ${isExiting ? 'animate-slide-down-out' : 'animate-slide-down'} cursor-pointer`}
        onClick={() => setToast(null)}
        title="클릭하면 닫힘"
      >
        <div 
          className={`nes-container is-rounded bg-retro-cream border-retro-thin shadow-[4px_4px_0_0_rgba(0,0,0,1)] !py-2 !px-3 hover:opacity-90 transition-opacity duration-150 ${
            isError ? 'text-retro-red' : 'text-retro-green'
          }`}
          style={{ backgroundColor: '#fbfbf5' }}
        >
          <div className="flex items-center gap-2">
            {isError ? (
              <img src="/icons/stop_icon.png" className="w-4 h-4 pixelated shrink-0" alt="error" />
            ) : (
              <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0 animate-bounce" alt="success" />
            )}
            <p className="text-retro-body-bold leading-snug">{toastToRender.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
