'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Journey, RoutePoint, TransportMode } from '@/domain/models/Journey';
import { fetchJourneyByShareId } from '@/application/queries/fetchJourneys';
import { formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { playClickSound } from '@/application/utils/audioUtils';

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// 헬퍼: 여정 통계 분석
function getJourneyStats(routePoints: RoutePoint[] = []) {
  if (!routePoints || routePoints.length === 0) {
    return {
      maxSpeed: 0,
      primaryMode: 'walk' as TransportMode,
      stamps: [] as string[]
    };
  }

  let maxSpeed = 0;
  const modeCounts: Record<string, number> = {};
  const stampsMap = new Set<string>();

  routePoints.forEach((pt) => {
    if (pt.speedKmh > maxSpeed) maxSpeed = pt.speedKmh;
    
    if (pt.confirmedMode) {
      modeCounts[pt.confirmedMode] = (modeCounts[pt.confirmedMode] || 0) + 1;
    }
    if (pt.visitedStationName) {
      stampsMap.add(pt.visitedStationName);
    }
  });

  let primaryMode: TransportMode = 'walk';
  let maxCount = 0;
  Object.entries(modeCounts).forEach(([mode, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryMode = mode as TransportMode;
    }
  });

  return {
    maxSpeed,
    primaryMode,
    stamps: Array.from(stampsMap)
  };
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    fetchJourneyByShareId(shareId)
      .then((j) => {
        if (!j) setNotFound(true);
        else setJourney(j);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  // 여정 통계 추출
  const stats = useMemo(() => {
    if (!journey) return { maxSpeed: 0, primaryMode: 'walk' as TransportMode, stamps: [] as string[] };
    return getJourneyStats(journey.route);
  }, [journey]);

  if (loading) {
    return (
      <main className="h-full overflow-y-auto bg-gray-100 font-neodgm flex items-center justify-center">
        <div className="text-center flex flex-col items-center justify-center gap-3">
          <img src="/icons/compass_icon.png" className="w-12 h-12 pixelated animate-spin" alt="loading" />
          <p className="text-xs text-gray-500 animate-pulse">클라우드 통신망에서 모험 기록 수신 중...</p>
        </div>
      </main>
    );
  }

  if (notFound || !journey) {
    return (
      <main className="h-full overflow-y-auto bg-gray-100 font-neodgm flex items-center justify-center p-4">
        <div className="nes-container is-rounded bg-retro-cream text-center py-10 max-w-xs w-full border-retro-thick shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-3">
          <img src="/icons/compass_icon.png" className="w-12 h-12 pixelated animate-pulse" alt="not found" />
          <div>
            <p className="text-sm text-gray-800 font-bold mb-1">존재하지 않는 모험 기록이에요.</p>
            <p className="text-xs text-gray-400">링크를 다시 확인해 주세요.</p>
          </div>
          <Link href="/" className="pixel-btn-3d is-primary text-retro-caption-bold py-2 px-4 flex items-center justify-center gap-1.5" style={{ textDecoration: 'none' }}>
            <img src="/icons/play_icon.png" className="w-4 h-4 pixelated shrink-0" alt="play" />
            <span>내 모험 시작하기</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto bg-gray-100 font-neodgm flex flex-col items-center justify-center p-4">
      <p className="text-retro-caption-bold text-retro-gray mb-4 tracking-[0.2em] uppercase">— SHARED QUEST RECEIPT —</p>

      {/* 영수증 카드 */}
      <div className="bg-retro-cream text-retro-dark drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full relative pt-8 pb-10 px-6 border-x-4 border-black animate-pixel-in">
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDgsaTEwLDEwIDIwLDAiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')] bg-repeat-x -mt-3" style={{ backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==")` }} />

        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h2 className="text-retro-title-lg text-retro-green font-bold mb-1 tracking-widest">RECEIPT</h2>
          <p className="text-retro-caption-bold text-retro-gray uppercase">Where Am I - Shared Journey</p>
        </div>

        <div className="space-y-3 px-2">
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">모험 일시</span>
            <span className="text-retro-body-bold text-retro-dark">{formatDate(journey.startTime)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">총 거리</span>
            <span className="text-retro-body-bold text-retro-green">{formatDistance(journey.totalDistanceKm)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">소요 시간</span>
            <span className="text-retro-body-bold text-retro-wood">{formatDuration(journey.totalDurationSec)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">주요 수단</span>
            <span className="text-retro-body-bold text-retro-green bg-retro-moss px-2 py-0.5 border border-black/10 flex items-center gap-1.5">
              <img src={TransportIconFactory.getIconPath(stats.primaryMode)} className="w-4 h-4 pixelated shrink-0" alt="mode" />
              <span>{TransportIconFactory.getModeText(stats.primaryMode)}</span>
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">최고 속도</span>
            <span className="text-retro-body-bold text-retro-red">{stats.maxSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="flex justify-between pb-2 items-center">
            <span className="text-retro-gray text-retro-body">모험 상태</span>
            <span className={`text-retro-caption-bold px-2 py-0.5 border-retro-thin flex items-center gap-1 bg-retro-moss ${
              journey.status === 'completed'
                ? 'text-retro-green'
                : 'text-retro-wood'
            }`}>
              {journey.status === 'completed' ? (
                <>
                  <img src="/icons/tree_hud.png" className="w-3.5 h-3.5 pixelated shrink-0 animate-bounce" alt="completed" />
                  <span>완료</span>
                </>
              ) : (
                <>
                  <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated animate-spin shrink-0" alt="ongoing" />
                  <span>진행중</span>
                </>
              )}
            </span>
          </div>
          
          {stats.stamps.length > 0 && (
            <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
              <span className="text-retro-caption-bold text-retro-gray block mb-1.5 uppercase">Stamp Book</span>
              <div className="flex flex-wrap gap-1.5">
                {stats.stamps.map((st, i) => (
                  <span key={i} className="text-retro-caption-bold bg-retro-moss border border-retro-thin text-retro-wood px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1">
                    <img src="/icons/bus_stop.png" className="w-3 h-3 pixelated shrink-0" alt="stamp" />
                    <span>{st}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 바코드 */}
        <div className="mt-4 flex flex-col items-center pt-4 border-t-2 border-black">
          <div className="flex gap-[2px] h-10 w-full justify-center opacity-70">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-retro-caption text-retro-gray mt-1 tracking-[0.3em]">{shareId}-JNY</p>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')] bg-repeat-x" />
      </div>

      {/* CTA */}
      <div className="mt-8 text-center flex flex-col items-center gap-2 select-none">
        <p className="text-retro-caption text-retro-gray mb-1">나도 내 모험을 기록하고 싶다면?</p>
        <Link 
          href="/" 
          onClick={() => { playClickSound(); }}
          className="pixel-btn-3d is-success text-retro-body-bold py-2 px-4 flex items-center justify-center gap-1.5" 
          style={{ textDecoration: 'none' }}
        >
          <img src="/icons/play_icon.png" className="w-4 h-4 pixelated shrink-0" alt="play" />
          <span>Where Am I? 시작하기</span>
        </Link>
      </div>
    </main>
  );
}
