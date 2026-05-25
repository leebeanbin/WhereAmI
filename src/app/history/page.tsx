'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Journey, RoutePoint, TransportMode } from '@/domain/models/Journey';
import { fetchJourneys } from '@/application/queries/fetchJourneys';
import { formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { DEFAULT_USER_ID } from '@/constants/api';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { playClickSound } from '@/application/utils/audioUtils';
import PixelToast from '@/components/PixelToast';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ko-KR', {
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

// 여정 카드 한 장
interface JourneyCardProps {
  journey: Journey;
  index: number;
  onOpenTicket: (journey: Journey) => void;
}

function JourneyCard({ journey, index, onOpenTicket }: JourneyCardProps) {
  const startDate = formatDate(journey.startTime);
  const duration = formatDuration(journey.totalDurationSec);
  const dist = formatDistance(journey.totalDistanceKm);
  const { setToast } = useLocationStore();

  // 여정 통계 추출
  const stats = useMemo(() => getJourneyStats(journey.route), [journey.route]);

  const iconPath = 
    stats.primaryMode === 'bus' ? '/icons/bus_blue.png' :
    stats.primaryMode === 'train' ? '/icons/subway_station.png' :
    stats.primaryMode === 'walk' ? '/icons/walk_man.png' :
    '/icons/banana.png';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClickSound();
    const url = `${window.location.origin}/share/${journey.shareId}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setToast({ message: '모험 공유 링크가 클립보드에 복사되었습니다!', type: 'success' });
      })
      .catch(() => {
        setToast({ message: '링크 복사에 실패했습니다.', type: 'error' });
      });
  };

  return (
    <div className="nes-container is-rounded bg-retro-cream border-retro-thick text-retro-dark animate-pixel-in flex flex-col gap-2.5 p-4 shadow-sm hover:border-[#2d6a4f] transition-colors"
      style={{ animationDelay: `${index * 0.05}s` }}>
      
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <img src={iconPath} className="w-6 h-6 pixelated shrink-0" alt="mode icon" />
          <div>
            <p className="text-retro-caption-bold text-retro-wood uppercase tracking-widest">QUEST #{String(index + 1).padStart(3, '0')}</p>
            <p className="text-retro-body-bold text-retro-dark">{startDate}</p>
          </div>
        </div>
        <span className={`text-retro-caption-bold px-2 py-0.5 border-retro-thin flex items-center gap-1 bg-retro-moss ${
          journey.status === 'completed'
            ? 'text-retro-green'
            : 'text-retro-wood'
        }`}>
          {journey.status === 'completed' ? (
            <>
              <img src="/icons/tree_hud.png" className="w-3 h-3 pixelated shrink-0" alt="completed" />
              <span>완료</span>
            </>
          ) : (
            <>
              <img src="/icons/compass_icon.png" className="w-3 h-3 pixelated animate-spin shrink-0" alt="ongoing" />
              <span>진행중</span>
            </>
          )}
        </span>
      </div>

      {/* 여정 핵심 통계 */}
      <div className="border-t border-dashed border-gray-200 pt-2 mt-1">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-retro-tiny text-retro-gray uppercase tracking-wider">거리</p>
            <p className="text-retro-body-bold text-retro-green">{dist}</p>
          </div>
          <div>
            <p className="text-retro-tiny text-retro-gray uppercase tracking-wider">시간</p>
            <p className="text-retro-body-bold text-retro-wood">{duration}</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-retro-tiny text-retro-gray uppercase tracking-wider mb-0.5">주요 수단</p>
            <p className="text-retro-body-bold text-retro-green flex items-center justify-center gap-1">
              <img src={TransportIconFactory.getIconPath(stats.primaryMode)} className="w-3.5 h-3.5 pixelated shrink-0" alt="mode" />
              <span className="text-retro-caption-bold">{TransportIconFactory.getModeText(stats.primaryMode)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 스탬프 북 및 최고 속도 상세 정보 */}
      <div className="bg-retro-moss p-2 rounded-sm border border-retro-thin flex flex-col gap-1 text-retro-caption-bold text-retro-dark">
        <div className="flex justify-between items-center">
          <span className="text-retro-gray">최고 속도 주파수</span>
          <span className="text-retro-body-bold text-retro-red">{stats.maxSpeed.toFixed(1)} km/h</span>
        </div>
        
        {stats.stamps.length > 0 ? (
          <div className="mt-1">
            <p className="text-retro-gray font-bold mb-1 flex items-center gap-1">
              <img src="/icons/bus_stop.png" className="w-3 h-3 pixelated shrink-0" alt="stamps" />
              <span>획득한 스탬프 ({stats.stamps.length}개):</span>
            </p>
            <div className="flex flex-wrap gap-1">
              {stats.stamps.slice(0, 3).map((name, i) => (
                <span key={i} className="text-retro-tiny bg-retro-moss border border-retro-thin text-retro-wood px-1 py-0.5 rounded-sm inline-flex items-center gap-1">
                  <img src="/icons/bus_stop.png" className="w-2.5 h-2.5 pixelated shrink-0" alt="stamp" />
                  <span>{name}</span>
                </span>
              ))}
              {stats.stamps.length > 3 && (
                <span className="text-retro-tiny text-retro-gray self-center pl-1">+{stats.stamps.length - 3}</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-retro-caption text-retro-gray italic mt-0.5">정류장 스탬프 기록 없음</p>
        )}
      </div>

      {/* 조작계 - 3D 레트로 버튼 시스템 적용 */}
      <div className="flex justify-between gap-2.5 mt-2 border-t border-dashed border-gray-200 pt-3 select-none">
        <button
          onClick={handleCopyLink}
          className="nes-btn is-primary text-retro-caption-bold py-1 px-3 flex-1 flex items-center justify-center gap-1.5 pixel-btn-3d-secondary"
        >
          <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="share" />
          <span>공유하기</span>
        </button>
        <button
          onClick={() => { playClickSound(); onOpenTicket(journey); }}
          className="nes-btn is-success text-retro-caption-bold py-1 px-3 flex-1 flex items-center justify-center gap-1.5 pixel-btn-3d-secondary"
        >
          <img src="/icons/controller_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="receipt" />
          <span>8비트 영수증</span>
        </button>
      </div>

    </div>
  );
}

// 8비트 스타일 영수증 모달 (상세 내용 보기 전용)
interface HistoryTicketModalProps {
  journey: Journey;
  onClose: () => void;
}

function HistoryTicketModal({ journey, onClose }: HistoryTicketModalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const dist = formatDistance(journey.totalDistanceKm);
  const duration = formatDuration(journey.totalDurationSec);
  const stats = useMemo(() => getJourneyStats(journey.route), [journey.route]);

  const handleClose = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 ${isExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}>
      <div className="bg-retro-cream text-retro-dark font-neodgm drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full max-h-[90vh] overflow-y-auto relative pt-8 pb-8 px-6 border-x-4 border-black" style={{ scrollbarWidth: 'none' }}>
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZiZmJmNSIvPjwvc3ZnPg==')] bg-repeat-x -mt-3" />
 
        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h2 className="text-retro-title-lg text-retro-green font-bold mb-1 tracking-widest">RECEIPT</h2>
          <p className="text-retro-caption-bold text-retro-gray uppercase">Where Am I - Journey Ticket</p>
        </div>

        <div className="space-y-3 px-2">
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">발급일시</span>
            <span className="text-retro-body-bold text-retro-dark">{formatDate(journey.startTime)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">총 거리</span>
            <span className="text-retro-body-bold text-retro-green">{dist}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">소요 시간</span>
            <span className="text-retro-body-bold text-retro-wood">{duration}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">주요 수단</span>
            <span className="text-retro-body-bold text-retro-green bg-retro-moss px-2 py-0.5 border border-black/10 flex items-center gap-1.5">
              <img src={TransportIconFactory.getIconPath(stats.primaryMode)} className="w-4 h-4 pixelated shrink-0" alt="mode" />
              <span>{TransportIconFactory.getModeText(stats.primaryMode)}</span>
            </span>
          </div>
          <div className="flex justify-between pb-2 items-center">
            <span className="text-retro-gray text-retro-body">최고 속도</span>
            <span className="text-retro-body-bold text-retro-red">{stats.maxSpeed.toFixed(1)} km/h</span>
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
        <div className="mt-4 flex flex-col items-center justify-center pt-4 border-t-2 border-solid border-black">
          <div className="flex gap-[2px] h-12 w-full justify-center opacity-85">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-retro-caption text-retro-gray mt-1 tracking-[0.3em]">
            {journey.shareId}-JNY
          </p>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
          <button onClick={handleClose} className="nes-btn is-success w-full text-retro-body-bold flex items-center justify-center gap-1.5 pixel-btn-3d-primary">
            <img src="/icons/controller_icon.png" className="w-4 h-4 pixelated shrink-0" alt="close" />
            <span>영수증 접기 (닫기)</span>
          </button>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmYmZiZjUiLz48L3N2Zz4=')] bg-repeat-x" />
      </div>
    </div>
  );
}


export default function HistoryPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 영수증 보기용 여정
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const { scanlineEnabled } = useLocationStore();

  useEffect(() => {
    fetchJourneys(DEFAULT_USER_ID)
      .then(setJourneys)
      .catch((e) => {
        console.error(e);
        setError('기록을 불러오는데 실패했습니다. Firebase 설정을 확인하세요.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={`h-full overflow-y-auto bg-gray-100 text-retro-dark font-neodgm p-4 md:p-6 ${scanlineEnabled ? 'crt-active scanlines crt-flicker crt-curve' : ''}`}>
      <PixelToast />

      {/* 헤더 */}
      <div className="nes-container is-rounded bg-retro-cream border-retro-thick p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-retro-title-lg font-bold retro-arcade-logo tracking-widest select-none">MY ARCHIVE</h1>
            <p className="text-retro-caption text-retro-gray mt-1">나의 모험 기록 보관함</p>
          </div>
          <Link 
            href="/" 
            onClick={() => playClickSound()}
            className="nes-btn is-primary text-retro-caption-bold py-1.5 px-3 flex items-center justify-center gap-1.5 pixel-btn-3d-secondary" 
            style={{ textDecoration: 'none' }}
          >
            <img src="/icons/play_icon.png" className="w-3.5 h-3.5 pixelated shrink-0 transform rotate-180" alt="back" />
            <span>모험 복귀</span>
          </Link>
        </div>
      </div>

      {/* 통계 배너 */}
      {!loading && !error && (
        <div className="nes-container is-rounded bg-retro-cream text-retro-dark border-retro-thick mb-4 relative overflow-hidden">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-retro-caption-bold text-retro-gray uppercase tracking-widest mb-1">Journeys</p>
              <p className="text-retro-title-md text-retro-wood font-bold">{journeys.length}</p>
            </div>
            <div>
              <p className="text-retro-caption-bold text-retro-gray uppercase tracking-widest mb-1">Total Dist</p>
              <p className="text-retro-subtitle text-retro-green font-bold">
                {formatDistance(journeys.reduce((s, j) => s + j.totalDistanceKm, 0))}
              </p>
            </div>
            <div>
              <p className="text-retro-caption-bold text-retro-gray uppercase tracking-widest mb-1">Total Time</p>
              <p className="text-retro-subtitle text-retro-wood font-bold">
                {formatDuration(journeys.reduce((s, j) => s + j.totalDurationSec, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading && (
        <div className="text-center py-20 flex flex-col items-center justify-center">
          <img src="/icons/compass_icon.png" className="w-12 h-12 mb-4 pixelated animate-spin" alt="loading" />
          <p className="text-retro-body-bold text-retro-gray animate-pulse">클라우드 통신망에서 모험 신호 해독 중...</p>
        </div>
      )}

      {error && (
        <div className="nes-container is-rounded bg-retro-cream border-retro-thick text-center py-8 flex flex-col items-center justify-center">
          <img src="/icons/stop_icon.png" className="w-8 h-8 mb-2 pixelated" alt="error" />
          <p className="text-retro-body-bold text-retro-red">{error}</p>
        </div>
      )}

      {!loading && !error && journeys.length === 0 && (
        <div className="nes-container is-rounded bg-retro-cream border-retro-thick text-center py-16 flex flex-col items-center justify-center">
          <img src="/icons/compass_icon.png" className="w-12 h-12 mb-3 pixelated animate-pulse" alt="empty map" />
          <p className="text-retro-body text-retro-gray mb-1">아직 정식 등록된 모험 기록이 존재하지 않습니다!</p>
          <p className="text-retro-caption text-retro-gray">당신의 첫 번째 Retro 발자취를 남겨 보십시오.</p>
          <Link 
            href="/" 
            onClick={() => playClickSound()}
            className="nes-btn is-success mt-4 inline-flex items-center justify-center gap-1.5 text-retro-caption-bold py-1.5 px-3 pixel-btn-3d-secondary" 
            style={{ textDecoration: 'none' }}
          >
            <img src="/icons/play_icon.png" className="w-4 h-4 pixelated shrink-0" alt="start" />
            <span>첫 모험 떠나기</span>
          </Link>
        </div>
      )}

      {!loading && !error && journeys.length > 0 && (
        <div className="flex flex-col gap-4">
          {journeys.map((j, i) => (
            <JourneyCard 
              key={j.journeyId} 
              journey={j} 
              index={journeys.length - 1 - i} 
              onOpenTicket={setSelectedJourney} 
            />
          ))}
        </div>
      )}

      {/* 상세 영수증 팝업 */}
      {selectedJourney && (
        <HistoryTicketModal 
          journey={selectedJourney} 
          onClose={() => setSelectedJourney(null)} 
        />
      )}
    </main>
  );
}
