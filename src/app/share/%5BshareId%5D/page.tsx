'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Journey, RoutePoint, TransportMode } from '@/domain/models/Journey';
import { fetchJourneyByShareId } from '@/application/queries/fetchJourneys';
import { formatDistance, formatDuration } from '@/application/utils/geoUtils';

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

  // 가장 빈도가 높은 이동 수단 찾기
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

  const stats = useMemo(() => {
    if (!journey) return { maxSpeed: 0, primaryMode: 'walk' as TransportMode, stamps: [] };
    return getJourneyStats(journey.route);
  }, [journey]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#181818] text-[#e0e8e0] font-neodgm flex items-center justify-center scanlines">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📡</div>
          <p className="text-xs text-gray-400 animate-pulse">우주에서 공유된 모험 주파수를 튜닝 중...</p>
        </div>
      </main>
    );
  }

  if (notFound || !journey) {
    return (
      <main className="min-h-screen bg-[#181818] text-[#e0e8e0] font-neodgm flex items-center justify-center p-4 scanlines">
        <div className="nes-container is-rounded bg-[#202020] border-4 border-black text-center py-10 max-w-xs w-full shadow-lg">
          <p className="text-3xl mb-3">🗺️</p>
          <p className="text-xs text-red-400 font-bold mb-1">여정을 찾을 수 없습니다</p>
          <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">손상되었거나 소멸된 차원 기록 링크입니다.</p>
          <Link href="/" className="nes-btn is-primary text-xs py-1 px-3">▶ 내 모험 개시</Link>
        </div>
      </main>
    );
  }

  const modeText = 
    stats.primaryMode === 'bus' ? '버스 🚌' :
    stats.primaryMode === 'train' ? '기차/지하철 🚆' :
    '도보 🚶';

  return (
    <main className="min-h-screen bg-[#181818] text-[#e0e8e0] font-neodgm flex flex-col items-center justify-center p-4 scanlines">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold retro-arcade-logo tracking-widest mb-1 select-none">SHARED QUEST</h1>
        <p className="text-[9px] text-gray-500 tracking-[0.2em] uppercase">— 탐험가의 수신된 모험 로그 —</p>
      </div>

      {/* 영수증 카드 */}
      <div className="bg-white text-black drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full relative pt-8 pb-10 px-6 border-4 border-black animate-pixel-in">
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x -mt-3" />

        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h2 className="text-3xl font-bold mb-1 tracking-widest">RECEIPT</h2>
          <p className="text-[10px] text-gray-500 uppercase">Where Am I - Shared Journey</p>
        </div>

        <div className="space-y-3 text-sm px-2">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">모험 일시</span>
            <span className="font-bold text-xs">{formatDate(journey.startTime)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">총 거리</span>
            <span className="font-bold text-blue-600">{formatDistance(journey.totalDistanceKm)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">소요 시간</span>
            <span className="font-bold text-purple-600">{formatDuration(journey.totalDurationSec)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">주요 수단</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 rounded-sm">{modeText}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">최고 속도</span>
            <span className="font-bold text-red-500">{stats.maxSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-gray-500">상태</span>
            <span className={`font-bold text-xs px-2 py-0.5 border ${
              journey.status === 'completed'
                ? 'border-green-500 text-green-600 bg-green-50'
                : 'border-yellow-500 text-yellow-600 bg-yellow-50'
            }`}>
              {journey.status === 'completed' ? '✅ 완료된 모험' : '🔄 진행 중'}
            </span>
          </div>

          {stats.stamps.length > 0 && (
            <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
              <span className="text-[10px] text-gray-400 font-bold tracking-widest block mb-1.5 uppercase">Stamp Book</span>
              <div className="flex flex-wrap gap-1.5">
                {stats.stamps.map((st, i) => (
                  <span key={i} className="text-[9px] bg-yellow-100 border border-yellow-400 text-yellow-800 font-bold px-1.5 py-0.5 rounded-sm inline-block">
                    📍 {st}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 바코드 */}
        <div className="mt-4 flex flex-col items-center pt-4 border-t-2 border-black">
          <div className="flex gap-[2px] h-10 w-full justify-center opacity-85">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-[8px] text-gray-400 mt-1 tracking-[0.3em]">{shareId}-JNY</p>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x" />
      </div>

      {/* CTA */}
      <div className="mt-8 text-center bg-[#202020] border-4 border-black p-4 rounded max-w-sm w-full">
        <p className="text-xs text-gray-400 mb-3 font-medium">나도 나만의 8비트 모험을 기록하고 싶다면?</p>
        <Link href="/" className="nes-btn is-success text-xs py-1.5 px-3">▶ Where Am I? 시작하기</Link>
      </div>
    </main>
  );
}
