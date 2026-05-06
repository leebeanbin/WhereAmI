'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportSchedule } from '@/domain/interfaces/IPublicTransportAdapter';

export default function StationBillboard() {
  const { selectedStation, setSelectedStation, currentLocation, cityCode } = useLocationStore();
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStation) return;

    setLoading(true);
    // BFF API 호출하여 선택된 정류장의 도착 정보 가져오기 (동적 cityCode 반영)
    fetch(`/api/transport?stationId=${selectedStation.stationId}&cityCode=${cityCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
           setSchedules(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

  }, [selectedStation, cityCode]);

  if (!selectedStation) return null;

  const handleCheckIn = () => {
    setToastMessage(`[${selectedStation.stationName}] 체크인 완료! 📝`);
    // TODO: Firestore에 이벤트 추가 로직 연동
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <>
      {/* 픽셀 토스트 메시지 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
          <div className="nes-balloon from-bottom text-xs font-neodgm px-4 py-2 text-center text-blue-600 drop-shadow-md">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
        <div className="nes-container is-rounded bg-[#1a1a1a] text-[#00ff00] font-neodgm shadow-2xl relative">
          {/* 닫기 버튼 */}
        <button 
          onClick={() => setSelectedStation(null)} 
          className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 w-8 h-8 flex items-center justify-center rounded-sm text-xs border-2 border-black pixel-btn"
        >
          X
        </button>

        {/* 상단 헤더 영역 */}
        <div className="flex justify-between items-center mb-4 border-b-4 border-[#333] pb-2">
           <h3 className="text-xl text-yellow-300">🚏 {selectedStation.stationName}</h3>
           <div className="flex gap-2">
             <button className="nes-btn is-warning text-[10px] px-2 py-1">⭐ 단골</button>
             <button onClick={handleCheckIn} className="nes-btn is-primary text-[10px] px-2 py-1">📍 이곳에 기록</button>
           </div>
        </div>

        {/* 전광판 메인 영역 */}
        <div className="h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
           {loading ? (
             <div className="text-center mt-8 animate-pulse text-sm">신호 수신 중...</div>
           ) : schedules.length === 0 ? (
             <div className="text-center mt-8 text-sm text-gray-400">도착 예정 정보가 없습니다.</div>
           ) : (
             <div className="space-y-3">
               {schedules.map((schedule, idx) => {
                  const arrivalTime = new Date(schedule.estimatedArrivalTime);
                  const diffMinutes = Math.round((arrivalTime.getTime() - Date.now()) / 60000);
                  const displayTime = diffMinutes <= 0 ? '곧 도착' : `${diffMinutes}분 후`;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center bg-[#000] p-2 border border-[#333]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl text-red-500 font-bold">{schedule.lineNo}</span>
                        <span className="text-xs text-gray-400">{schedule.currentStop} 방면</span>
                      </div>
                      <div className="text-xl text-cyan-400 animate-pulse">{displayTime}</div>
                    </div>
                  );
               })}
             </div>
           )}
        </div>
      </div>
      </div>
    </>
  );
}
