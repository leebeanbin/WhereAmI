'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { journeyRepository } from '@/infrastructure/repositories/FirebaseJourneyRepository';
import { useEffect, useState, useMemo } from 'react';

export default function JourneyTicket() {
  const { showTicketModal, setShowTicketModal, route } = useLocationStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveComplete, setSaveComplete] = useState(false);

  // ✅ 모든 Hook은 반드시 조건부 return 이전에 선언해야 합니다 (Rules of Hooks)
  const stats = useMemo(() => {
    let maxSpeed = 0, walkCount = 0, busCount = 0, trainCount = 0;
    route.forEach(p => {
      if (p.speedKmh > maxSpeed) maxSpeed = p.speedKmh;
      if (p.confirmedMode === 'walk') walkCount++;
      else if (p.confirmedMode === 'bus') busCount++;
      else if (p.confirmedMode === 'train') trainCount++;
    });
    const primaryMode =
      busCount > walkCount && busCount > trainCount ? '버스 🚌' :
      trainCount > walkCount && trainCount > busCount ? '기차/지하철 🚆' :
      '도보 🚶';
    return { maxSpeed, primaryMode, totalPoints: route.length };
  }, [route]);

  useEffect(() => {
    if (!showTicketModal || route.length === 0 || saveComplete || isSaving) return;

    setIsSaving(true);
    const startTime = route[0].time;
    const durationSec = (Date.now() - startTime) / 1000;
    const distanceKm = route.length * 0.01;

    journeyRepository.saveFullJourney('anonymous', route, distanceKm, durationSec)
      .then(() => {
        console.log('여정 저장 완료');
        setSaveComplete(true);
      })
      .catch(err => console.error('저장 실패:', err))
      .finally(() => setIsSaving(false));
  }, [showTicketModal, route, saveComplete, isSaving]);

  const handleClose = () => {
    setShowTicketModal(false);
  };

  // ✅ 조건부 return은 Hook 선언이 모두 끝난 뒤에만 위치해야 합니다
  if (!showTicketModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* 영수증(Ticket) UI - 진짜 종이 영수증 느낌으로 개선 */}
      <div className="bg-white text-black font-neodgm drop-shadow-[8px_8px_0_rgba(0,0,0,1)] max-w-sm w-full relative pt-8 pb-8 px-6">
        {/* 상단 톱니바퀴 (영수증 절취선) */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDAgMTAsMTAgMjAsMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] bg-repeat-x -mt-3"></div>

        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
           <h2 className="text-3xl font-bold mb-1 tracking-widest">RECEIPT</h2>
           <p className="text-[10px] text-gray-500 uppercase">Where Am I - Journey Ticket</p>
        </div>

        <div className="space-y-4 text-sm px-2">
           <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">발급일시</span>
              <span className="font-bold">{new Date().toLocaleString()}</span>
           </div>
           <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">주요 수단</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 rounded-sm">{stats.primaryMode}</span>
           </div>
           <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">최고 속도</span>
              <span className="text-red-500 font-bold">{stats.maxSpeed.toFixed(1)} km/h</span>
           </div>
           <div className="flex justify-between pb-2">
              <span className="text-gray-500">기록 지점</span>
              <span className="font-bold">{stats.totalPoints} pts</span>
           </div>
        </div>

        {/* 바코드 장식 영역 */}
        <div className="mt-4 flex flex-col items-center justify-center pt-4 border-t-2 border-solid border-black">
           <div className="flex gap-[2px] h-12 w-full justify-center opacity-80">
             {[...Array(30)].map((_, i) => (
               <div key={i} className="bg-black" style={{ width: `${Math.floor(Math.random() * 4) + 1}px` }}></div>
             ))}
           </div>
           <p className="text-[8px] text-gray-400 mt-1 tracking-[0.3em]">
             {route.length > 0 ? route[0].time : Date.now()}-JNY
           </p>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
           {isSaving ? (
              <p className="text-xs text-blue-500 mb-4 animate-pulse">☁️ 클라우드에 기록 중...</p>
           ) : (
              <p className="text-xs text-green-600 mb-4 font-bold">✨ 모험이 안전하게 기록되었습니다!</p>
           )}
           <button 
             onClick={handleClose}
             className="nes-btn is-success w-full"
           >
             확인 및 닫기
           </button>
        </div>
        
        {/* 하단 톱니바퀴 (영수증 절취선) */}
        <div className="absolute -bottom-3 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDEwLDAgMjAsMTAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-repeat-x"></div>
      </div>
    </div>
  );
}
