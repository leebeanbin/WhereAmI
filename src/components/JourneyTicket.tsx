'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { useSaveJourneyFacade } from '@/application/facades/useSaveJourneyFacade';
import { getDistanceFromLatLonInKm, formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { DEFAULT_USER_ID } from '@/constants/api';
import { MS_PER_SECOND } from '@/constants/math';
import { useEffect, useState, useMemo } from 'react';

export default function JourneyTicket() {
  const { showTicketModal, setShowTicketModal, route, setToast } = useLocationStore();
  const { saveJourney } = useSaveJourneyFacade();
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let maxSpeed = 0, walkCount = 0, busCount = 0, trainCount = 0, totalDistanceKm = 0;

    route.forEach((p, i) => {
      if (p.speedKmh > maxSpeed) maxSpeed = p.speedKmh;
      if (p.confirmedMode === 'walk') walkCount++;
      else if (p.confirmedMode === 'bus') busCount++;
      else if (p.confirmedMode === 'train') trainCount++;
      if (i > 0) {
        totalDistanceKm += getDistanceFromLatLonInKm(
          route[i - 1].lat, route[i - 1].lng, p.lat, p.lng
        );
      }
    });

    const durationSec = route.length > 1
      ? (route[route.length - 1].time - route[0].time) / MS_PER_SECOND
      : 0;

    const primaryMode =
      busCount > walkCount && busCount > trainCount ? '버스 🚌' :
      trainCount > walkCount && trainCount > busCount ? '기차/지하철 🚆' :
      '도보 🚶';

    return { maxSpeed, primaryMode, totalPoints: route.length, totalDistanceKm, durationSec };
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
        setToast({ message: '저장에 실패했습니다. 네트워크를 확인해주세요. 💦', type: 'error' });
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
      setToast({ message: '링크가 복사되었습니다! 📋', type: 'success' });
    }
  };

  const handleClose = () => {
    setShowTicketModal(false);
    setSaveComplete(false);
    setSaveFailed(false);
    setShareId(null);
  };

  if (!showTicketModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-pixel-in">
      <div className="bg-white text-black font-neodgm drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full relative pt-8 pb-8 px-6">
        {/* 상단 절취선 */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x -mt-3" />

        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
          <h2 className="text-3xl font-bold mb-1 tracking-widest">RECEIPT</h2>
          <p className="text-[10px] text-gray-500 uppercase">Where Am I - Journey Ticket</p>
        </div>

        <div className="space-y-3 text-sm px-2">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">발급일시</span>
            <span className="font-bold text-xs">{new Date().toLocaleString('ko-KR')}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">총 거리</span>
            <span className="font-bold text-blue-600">{formatDistance(stats.totalDistanceKm)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">소요 시간</span>
            <span className="font-bold text-purple-600">{formatDuration(stats.durationSec)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">주요 수단</span>
            <span className="font-bold text-green-700 bg-green-50 px-2 rounded-sm">{stats.primaryMode}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-gray-500">최고 속도</span>
            <span className="text-red-500 font-bold">{stats.maxSpeed.toFixed(1)} km/h</span>
          </div>
        </div>

        {/* 바코드 */}
        <div className="mt-4 flex flex-col items-center justify-center pt-4 border-t-2 border-solid border-black">
          <div className="flex gap-[2px] h-12 w-full justify-center opacity-80">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="bg-black" style={{ width: `${(i % 3) + 1}px` }} />
            ))}
          </div>
          <p className="text-[8px] text-gray-400 mt-1 tracking-[0.3em]">
            {shareId ?? (route.length > 0 ? route[0].time : Date.now())}-JNY
          </p>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
          {isSaving ? (
            <p className="text-xs text-blue-500 mb-4 animate-pulse">☁️ 클라우드에 기록 중...</p>
          ) : saveFailed ? (
            <p className="text-xs text-red-500 mb-4 font-bold">💦 저장에 실패했습니다.</p>
          ) : saveComplete ? (
            <p className="text-xs text-green-600 mb-4 font-bold">✨ 모험이 안전하게 기록되었습니다!</p>
          ) : null}

          {saveComplete && shareId && (
            <button onClick={handleShare} className="nes-btn is-primary w-full mb-3 text-sm">
              🔗 이 모험 공유하기
            </button>
          )}

          <button onClick={handleClose} className="nes-btn is-success w-full">
            확인 및 닫기
          </button>
        </div>

        {/* 하단 절취선 */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x" />
      </div>
    </div>
  );
}
