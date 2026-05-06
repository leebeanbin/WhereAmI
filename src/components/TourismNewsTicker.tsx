import { useEffect } from 'react';
import { useLocationStore } from '@/store/useLocationStore';

export default function TourismNewsTicker() {
  const { tourismNews, setTourismNews } = useLocationStore();

  useEffect(() => {
    if (tourismNews) {
      // 8초 뒤에 자동으로 뉴스 소식을 닫음
      const timer = setTimeout(() => {
        setTourismNews(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [tourismNews, setTourismNews]);

  if (!tourismNews) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-11/12 max-w-md animate-slide-down pointer-events-none">
      <div className="nes-container is-rounded bg-yellow-200 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl animate-bounce">🔔</div>
          <div className="flex-1">
            <h4 className="text-red-600 text-xs font-bold mb-1">[주변 명소 속보]</h4>
            <p className="text-black text-sm leading-tight">
              앗! 방금 <span className="text-blue-600 font-bold">'{tourismNews.title}'</span> 근처({tourismNews.distance}m)를 지나셨네요! 멋진 곳이랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
