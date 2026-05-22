'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { useSaveJourneyFacade } from '@/application/facades/useSaveJourneyFacade';
import { getDistanceFromLatLonInKm, formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { DEFAULT_USER_ID } from '@/constants/api';
import { MS_PER_SECOND } from '@/constants/math';
import { useEffect, useState, useMemo } from 'react';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { TransportMode } from '@/domain/models/Journey';

export default function JourneyTicket() {
  const { showTicketModal, setShowTicketModal, route, setToast } = useLocationStore();
  const { saveJourney } = useSaveJourneyFacade();
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  // 로컬 렌더링 상태 및 퇴장 애니메이션 제어
  const [shouldRender, setShouldRender] = useState(showTicketModal);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (showTicketModal) {
      setShouldRender(true);
      setIsExiting(false);
    } else {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsExiting(false);
      }, 300); // pixel-fade-out 지속 시간과 일치
      return () => clearTimeout(timer);
    }
  }, [showTicketModal]);

  const stats = useMemo(() => {
    let maxSpeed = 0, walkCount = 0, busCount = 0, trainCount = 0, totalDistanceKm = 0;
    const checkedInStations: string[] = [];

    route.forEach((p, i) => {
      if (p.speedKmh > maxSpeed) maxSpeed = p.speedKmh;
      if (p.confirmedMode === 'walk') walkCount++;
      else if (p.confirmedMode === 'bus') busCount++;
      else if (p.confirmedMode === 'train') trainCount++;
      if (p.visitedStationName && !checkedInStations.includes(p.visitedStationName)) {
        checkedInStations.push(p.visitedStationName);
      }
      if (i > 0) {
        totalDistanceKm += getDistanceFromLatLonInKm(
          route[i - 1].lat, route[i - 1].lng, p.lat, p.lng
        );
      }
    });

    const durationSec = route.length > 1
      ? (route[route.length - 1].time - route[0].time) / MS_PER_SECOND
      : 0;

    const primaryMode: TransportMode =
      busCount > walkCount && busCount > trainCount ? 'bus' :
      trainCount > walkCount && trainCount > busCount ? 'train' :
      'walk';

    return { maxSpeed, primaryMode, totalPoints: route.length, totalDistanceKm, durationSec, checkedInStations };
  }, [route]);

  useEffect(() => {
    if (!showTicketModal || route.length === 0 || saveComplete || isSaving) return;

    setIsSaving(true);
    saveJourney(DEFAULT_USER_ID, route, stats.totalDistanceKm, stats.durationSec)
      .then((journey) => {
        setSaveComplete(true);
        setShareId(journey.shareId);
      })
      .catch(err => {
        console.error('저장 실패:', err);
        setSaveFailed(true);
        setToast({ message: '저장에 실패했습니다. 네트워크를 확인해주세요.', type: 'error' });
      })
      .finally(() => setIsSaving(false));
  }, [showTicketModal, route, saveComplete, isSaving, stats.totalDistanceKm, stats.durationSec]);

  const handleShare = async () => {
    if (!shareId) return;
    const url = `${window.location.origin}/share/${shareId}`;
    if (navigator.share) {
      await navigator.share({ title: 'Where Am I? 모험 기록', url });
    } else {
      await navigator.clipboard.writeText(url);
      setToast({ message: '링크가 복사되었습니다!', type: 'success' });
    }
  };

  const handleClose = () => {
    setShowTicketModal(false);
    setSaveComplete(false);
    setSaveFailed(false);
    setShareId(null);
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${isExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}>
      <div className="bg-retro-cream text-retro-dark font-neodgm drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full max-h-[90vh] overflow-y-auto relative pt-8 pb-8 px-6 border-x-4 border-black" style={{ scrollbarWidth: 'none', backgroundColor: '#fbfbf5' }}>
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZiZmJmNSIvPjwvc3ZnPg==')] bg-repeat-x -mt-3" />

        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h2 className="text-retro-title-lg text-retro-green font-bold mb-1 tracking-widest">RECEIPT</h2>
          <p className="text-retro-caption-bold text-retro-gray uppercase">Where Am I - Journey Ticket</p>
        </div>

        <div className="space-y-3 px-2">
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">발급일시</span>
            <span className="text-retro-body-bold text-retro-dark">{new Date().toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">총 거리</span>
            <span className="text-retro-body-bold text-retro-green">{formatDistance(stats.totalDistanceKm)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2 items-center">
            <span className="text-retro-gray text-retro-body">소요 시간</span>
            <span className="text-retro-body-bold text-retro-wood">{formatDuration(stats.durationSec)}</span>
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
          {stats.checkedInStations.length > 0 && (
            <div className="border-t border-dashed border-gray-300 pt-2 mt-2">
              <span className="text-retro-caption-bold text-retro-gray block mb-1.5 uppercase">Stamp Book</span>
              <div className="flex flex-wrap gap-1.5">
                {stats.checkedInStations.map((st, i) => (
                  <span key={i} className="text-retro-caption-bold bg-retro-moss border border-retro-thin text-retro-wood px-1.5 py-0.5 rounded-sm animate-pulse inline-flex items-center gap-1">
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
          <div className="flex gap-[2px] h-12 w-full justify-center opacity-80">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-retro-caption text-retro-gray mt-1 tracking-[0.3em]">
            {shareId ?? (route.length > 0 ? route[0].time : Date.now())}-JNY
          </p>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
          {isSaving ? (
            <p className="text-retro-body-bold text-retro-green mb-4 animate-pulse flex items-center justify-center gap-1.5">
              <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated animate-spin shrink-0" alt="saving" />
              <span>클라우드에 기록 중...</span>
            </p>
          ) : saveFailed ? (
            <p className="text-retro-body-bold text-retro-red mb-4 font-bold flex items-center justify-center gap-1.5">
              <img src="/icons/stop_icon.png" className="w-4 h-4 pixelated shrink-0" alt="failed" />
              <span>저장에 실패했습니다.</span>
            </p>
          ) : saveComplete ? (
            <p className="text-retro-body-bold text-retro-green mb-4 font-bold flex items-center justify-center gap-1.5">
              <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0 animate-bounce" alt="success" />
              <span>모험이 안전하게 기록되었습니다!</span>
            </p>
          ) : null}

          {saveComplete && shareId && (
            <button onClick={handleShare} className="nes-btn is-primary w-full mb-3 text-retro-body-bold flex items-center justify-center gap-1.5">
              <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated shrink-0" alt="share" />
              <span>이 모험 공유하기</span>
            </button>
          )}

          <button onClick={handleClose} className="nes-btn is-success w-full text-retro-body-bold flex items-center justify-center gap-1.5">
            <img src="/icons/controller_icon.png" className="w-4 h-4 pixelated shrink-0" alt="close" />
            <span>확인 및 닫기</span>
          </button>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmYmZiZjUiLz48L3N2Zz4=')] bg-repeat-x" />
      </div>
    </div>
  );
}
