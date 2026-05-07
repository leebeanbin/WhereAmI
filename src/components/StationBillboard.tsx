'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportSchedule } from '@/domain/interfaces/IPublicTransportAdapter';

interface SubwayArrival {
  lineId: string;
  trainLineNm: string;
  arvlMsg2: string;
  arvlMsg3: string;
  arvlCd: string;
}

export default function StationBillboard() {
  const { selectedStation, setSelectedStation, cityCode, setToast } = useLocationStore();
  const [activeTab, setActiveTab] = useState<'bus' | 'subway'>('bus');
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [subwayArrivals, setSubwayArrivals] = useState<SubwayArrival[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedStation) return;
    setActiveTab(selectedStation.type === 'subway' ? 'subway' : 'bus');
    setSchedules([]);
    setSubwayArrivals([]);
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'bus') return;

    setLoading(true);
    fetch(`/api/transport?stationId=${selectedStation.stationId}&cityCode=${cityCode}`)
      .then(res => res.json())
      .then(data => { if (!data.error) setSchedules(data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedStation, cityCode, activeTab]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'subway') return;

    setLoading(true);
    fetch(`/api/subway?stationName=${encodeURIComponent(selectedStation.stationName)}`)
      .then(res => res.json())
      .then(data => { if (!data.error) setSubwayArrivals(data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedStation, activeTab]);

  if (!selectedStation) return null;

  const handleCheckIn = () => {
    setToast({ message: '체크인 기능은 곧 추가됩니다! 🚧', type: 'error' });
  };

  return (
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
        <div className="flex justify-between items-center mb-3 border-b-4 border-[#333] pb-2">
          <h3 className="text-xl text-yellow-300">🚏 {selectedStation.stationName}</h3>
          <div className="flex gap-2">
            <button className="nes-btn is-warning text-[10px] px-2 py-1">⭐ 단골</button>
            <button onClick={handleCheckIn} className="nes-btn is-primary text-[10px] px-2 py-1">📍 이곳에 기록</button>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('bus')}
            className={`nes-btn text-[10px] px-3 py-1 ${activeTab === 'bus' ? 'is-primary' : ''}`}
          >
            🚌 버스
          </button>
          <button
            onClick={() => setActiveTab('subway')}
            className={`nes-btn text-[10px] px-3 py-1 ${activeTab === 'subway' ? 'is-primary' : ''}`}
          >
            🚇 지하철
          </button>
        </div>

        {/* 전광판 메인 영역 */}
        <div className="h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="text-center mt-8 animate-pulse text-sm">신호 수신 중...</div>
          ) : activeTab === 'bus' ? (
            schedules.length === 0 ? (
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
            )
          ) : (
            subwayArrivals.length === 0 ? (
              <div className="text-center mt-8 text-sm text-gray-400">지하철 도착 정보가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {subwayArrivals.map((arrival, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#000] p-2 border border-[#333]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-yellow-300 font-bold">{arrival.trainLineNm}</span>
                    </div>
                    <div className="text-sm text-cyan-400 animate-pulse">{arrival.arvlMsg2}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
