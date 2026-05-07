'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Journey } from '@/domain/models/Journey';
import { fetchJourneyByShareId } from '@/application/queries/fetchJourneys';
import { formatDistance, formatDuration } from '@/application/utils/geoUtils';

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#e0e8e0] font-neodgm flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">📡</div>
          <p className="text-sm text-gray-600 animate-pulse">모험 기록을 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (notFound || !journey) {
    return (
      <main className="min-h-screen bg-[#e0e8e0] font-neodgm flex items-center justify-center p-4">
        <div className="nes-container is-rounded bg-white text-center py-10 max-w-xs w-full shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <p className="text-3xl mb-3">🗺️</p>
          <p className="text-sm text-gray-600 mb-1">존재하지 않는 모험 기록이에요.</p>
          <p className="text-xs text-gray-400 mb-6">링크를 다시 확인해 주세요.</p>
          <Link href="/" className="nes-btn is-primary text-xs">▶ 내 모험 시작하기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e0e8e0] font-neodgm flex flex-col items-center justify-center p-4">
      <p className="text-xs text-gray-500 mb-3 tracking-widest uppercase">— shared journey —</p>

      {/* 영수증 카드 */}
      <div className="bg-white text-black drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full relative pt-8 pb-10 px-6">
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x -mt-3" />

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
        </div>

        {/* 바코드 */}
        <div className="mt-4 flex flex-col items-center pt-4 border-t-2 border-black">
          <div className="flex gap-[2px] h-10 w-full justify-center opacity-70">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-[8px] text-gray-400 mt-1 tracking-[0.3em]">{shareId}-JNY</p>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x" />
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 mb-3">나도 내 모험을 기록하고 싶다면?</p>
        <Link href="/" className="nes-btn is-success text-sm">▶ Where Am I? 시작하기</Link>
      </div>
    </main>
  );
}
