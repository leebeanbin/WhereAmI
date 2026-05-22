import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';

export default function TourismNewsTicker() {
  const { tourismNews, setTourismNews } = useLocationStore();
  const [newsToRender, setNewsToRender] = useState(tourismNews);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (tourismNews) {
      setNewsToRender(tourismNews);
      setIsExiting(false);
    } else if (newsToRender) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setNewsToRender(null);
        setIsExiting(false);
      }, 400); // slide-down-out 지속 시간과 일치
      return () => clearTimeout(timer);
    }
  }, [tourismNews, newsToRender]);

  useEffect(() => {
    if (tourismNews) {
      // 8초 뒤에 자동으로 뉴스 소식을 닫음
      const timer = setTimeout(() => {
        setTourismNews(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [tourismNews, setTourismNews]);

  if (!newsToRender) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-md pointer-events-none">
      <div
        className={`pointer-events-auto ${isExiting ? 'animate-slide-down-out' : 'animate-slide-down'} cursor-pointer`}
        onClick={() => setTourismNews(null)}
        title="클릭하면 닫힘"
      >
        <div 
          className="nes-container is-rounded bg-retro-cream border-retro-thick shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3 hover:opacity-95 transition-opacity duration-150"
          style={{ backgroundColor: '#fbfbf5' }}
        >
          <div className="flex items-center gap-3">
            <img src="/icons/compass_icon.png" className="w-8 h-8 pixelated shrink-0 animate-bounce" alt="alert" />
            <div className="flex-1">
              <h4 className="text-retro-body-bold text-retro-red mb-1">[주변 명소 속보]</h4>
              <p className="text-retro-body text-retro-dark leading-tight">
                앗! 방금 <span className="text-retro-wood font-bold">'{newsToRender.title}'</span> 근처(<span className="text-retro-green font-bold">{newsToRender.distance}m</span>)를 지나셨네요! 멋진 곳이랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
