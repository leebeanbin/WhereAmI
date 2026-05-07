'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Journey } from '@/domain/models/Journey';
import { fetchJourneys } from '@/domain/queries/fetchJourneys';
import { formatDistance, formatDuration } from '@/application/utils/geoUtils';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}


// 여정 카드 한 장
function JourneyCard({ journey, index }: { journey: Journey; index: number }) {
  const emoji = ['🚀', '🌟', '🎯', '🗺️', '🌈', '⚡', '🎪', '🏆'][index % 8];
  const startDate = formatDate(journey.startTime);
  const duration = formatDuration(journey.totalDurationSec);
  const dist = formatDistance(journey.totalDistanceKm);

  return (
    <div className="nes-container is-rounded bg-white border-2 border-black animate-pixel-in"
      style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="text-xs text-gray-500">#{String(index + 1).padStart(3, '0')}</p>
            <p className="text-[11px] text-gray-700 font-bold">{startDate}</p>
          </div>
        </div>
        <span className={`text-[9px] px-2 py-1 border font-bold ${
          journey.status === 'completed'
            ? 'border-green-500 text-green-600 bg-green-50'
            : 'border-yellow-500 text-yellow-600 bg-yellow-50'
        }`}>
          {journey.status === 'completed' ? '✅ 완료' : '🔄 진행중'}
        </span>
      </div>

      <div className="border-t-2 border-dashed border-gray-200 pt-2 mt-2">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-[9px] text-gray-400 uppercase">Distance</p>
            <p className="text-sm font-bold text-blue-600">{dist}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase">Duration</p>
            <p className="text-sm font-bold text-purple-600">{duration}</p>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-dashed border-gray-100">
        <p className="text-[8px] text-gray-300 tracking-[0.3em] text-center">
          ID: {journey.shareId}
        </p>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJourneys('anonymous')
      .then(setJourneys)
      .catch((e) => {
        console.error(e);
        setError('기록을 불러오는데 실패했습니다. Firebase 설정을 확인하세요.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#e0e8e0] font-neodgm p-4">
      {/* 헤더 */}
      <div className="nes-container is-rounded with-title bg-white mb-4 shadow-sm">
        <p className="title text-blue-600">My Archive</p>
        <div className="flex items-center justify-between">
          <span className="text-sm">나의 모험 기록 보관함</span>
          <Link href="/" className="nes-btn is-primary text-[10px] py-1 px-2">
            ▶ 새 모험
          </Link>
        </div>
      </div>

      {/* 통계 배너 */}
      {!loading && !error && (
        <div className="nes-container is-rounded bg-[#1a1a2e] text-white mb-4 scanlines relative overflow-hidden">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] text-gray-400 uppercase mb-1">Journeys</p>
              <p className="text-2xl text-yellow-300">{journeys.length}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase mb-1">Total Dist</p>
              <p className="text-lg text-cyan-300">
                {formatDistance(journeys.reduce((s, j) => s + j.totalDistanceKm, 0))}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 uppercase mb-1">Total Time</p>
              <p className="text-lg text-green-300">
                {formatDuration(journeys.reduce((s, j) => s + j.totalDurationSec, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4 animate-bounce">📡</div>
          <p className="text-sm text-gray-500 animate-pulse">클라우드에서 기록을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="nes-container is-rounded bg-red-50 border-2 border-red-300 text-center py-8">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && journeys.length === 0 && (
        <div className="nes-container is-rounded bg-white text-center py-12">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-sm text-gray-500 mb-1">아직 저장된 모험이 없어요!</p>
          <p className="text-[11px] text-gray-400">첫 번째 모험을 떠나볼까요?</p>
          <Link href="/" className="nes-btn is-success mt-4 inline-block text-[11px]">
            ▶ 첫 모험 시작하기
          </Link>
        </div>
      )}

      {!loading && !error && journeys.length > 0 && (
        <div className="flex flex-col gap-3">
          {journeys.map((j, i) => (
            <JourneyCard key={j.journeyId} journey={j} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
