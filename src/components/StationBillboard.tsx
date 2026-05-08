'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { useFavoriteStations } from '@/application/hooks/useFavoriteStations';
import { TransportSchedule } from '@/domain/interfaces/IPublicTransportAdapter';
import { MS_PER_MINUTE } from '@/constants/math';
import type { ApiBody } from '@/lib/apiResponse';
import type { SubwayArrivalDto, TrainDto } from '@/application/dtos/TransportDto';

type Tab = 'bus' | 'subway' | 'train';

function formatTrainTime(t: string): string {
  // YYYYMMDDHHMMSS → HH:MM
  return t.length >= 12 ? `${t.slice(8, 10)}:${t.slice(10, 12)}` : t;
}

function normalizeSubwayName(stationName: string): string {
  // "강남역 2호선" → "강남역", "홍대입구역 경의중앙선" → "홍대입구역"
  return stationName.replace(/\s+\S*선.*$/, '');
}

function extractTrainStationName(stationName: string): string {
  // "강남역 2호선" → "강남", "서울역" → "서울"
  return stationName.replace(/\s+\S*선.*$/, '').replace(/역$/, '');
}

export default function StationBillboard() {
  const { selectedStation, setSelectedStation, cityCode, setToast } = useLocationStore();
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStations();
  const [activeTab, setActiveTab] = useState<Tab>('bus');
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [subwayArrivals, setSubwayArrivals] = useState<SubwayArrivalDto[]>([]);
  const [trains, setTrains] = useState<TrainDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!selectedStation) return;
    setActiveTab(selectedStation.type === 'subway' ? 'subway' : 'bus');
    setSchedules([]);
    setSubwayArrivals([]);
    setTrains([]);
    setFetchError(null);
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'bus') return;

    setLoading(true);
    setFetchError(null);
    fetch(`/api/transport?stationId=${selectedStation.stationId}&cityCode=${cityCode}`)
      .then(res => res.json() as Promise<ApiBody<TransportSchedule[]>>)
      .then(body => {
        if (body.success) setSchedules(body.data);
        else setFetchError('버스 정보를 불러오지 못했습니다.');
      })
      .catch(() => setFetchError('버스 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedStation, cityCode, activeTab, retryKey]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'subway') return;

    setLoading(true);
    setFetchError(null);
    const subwayName = normalizeSubwayName(selectedStation.stationName);
    fetch(`/api/subway?stationName=${encodeURIComponent(subwayName)}`)
      .then(res => res.json() as Promise<ApiBody<SubwayArrivalDto[]>>)
      .then(body => {
        if (body.success) setSubwayArrivals(body.data);
        else setFetchError('지하철 정보를 불러오지 못했습니다.');
      })
      .catch(() => setFetchError('지하철 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedStation, activeTab, retryKey]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'train') return;

    setLoading(true);
    setFetchError(null);
    const depName = extractTrainStationName(selectedStation.stationName);
    fetch(`/api/train?depStationName=${encodeURIComponent(depName)}`)
      .then(res => res.json() as Promise<ApiBody<TrainDto[]>>)
      .then(body => {
        if (body.success) setTrains(body.data);
        else setFetchError('열차 정보를 불러오지 못했습니다.');
      })
      .catch(() => setFetchError('열차 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedStation, activeTab, retryKey]);

  if (!selectedStation) return null;

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
            <button
              onClick={() => {
                const wasFavorite = isFavorite(selectedStation.stationId);
                toggleFavorite(selectedStation.stationId);
                setToast({
                  message: wasFavorite ? '즐겨찾기에서 제거했습니다.' : '즐겨찾기에 추가했습니다! ⭐',
                  type: wasFavorite ? 'error' : 'success',
                });
              }}
              className={`nes-btn text-[10px] px-2 py-1 ${isFavorite(selectedStation.stationId) ? 'is-warning' : ''}`}
            >
              {isFavorite(selectedStation.stationId) ? '⭐ 단골' : '☆ 단골'}
            </button>
            <button
              disabled
              className="nes-btn is-disabled text-[10px] px-2 py-1 opacity-40 cursor-not-allowed"
              title="준비 중인 기능입니다"
            >
              📍 이곳에 기록
            </button>
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
          <button
            onClick={() => setActiveTab('train')}
            className={`nes-btn text-[10px] px-3 py-1 ${activeTab === 'train' ? 'is-primary' : ''}`}
          >
            🚆 열차
          </button>
        </div>

        {/* 전광판 메인 영역 */}
        <div className="h-32 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="text-center mt-8 animate-pulse text-sm">신호 수신 중...</div>
          ) : fetchError ? (
            <div className="text-center mt-6">
              <p className="text-sm text-red-400 mb-3">{fetchError}</p>
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="nes-btn is-error text-[10px] px-3 py-1"
              >
                🔄 재시도
              </button>
            </div>
          ) : activeTab === 'bus' ? (
            schedules.length === 0 ? (
              <div className="text-center mt-8 text-sm text-gray-400">도착 예정 정보가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule, idx) => {
                  const arrivalTime = new Date(schedule.estimatedArrivalTime);
                  const diffMinutes = Math.round((arrivalTime.getTime() - Date.now()) / MS_PER_MINUTE);
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
          ) : activeTab === 'subway' ? (
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
          ) : (
            trains.length === 0 ? (
              <div className="text-center mt-8 text-sm text-gray-400">출발하는 열차 정보가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {trains.map((train, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#000] p-2 border border-[#333]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400 font-bold">{train.trainTypeName}</span>
                      <span className="text-xs text-gray-400">→ {train.arrPlaceName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-cyan-400">{formatTrainTime(train.depPlandTime)}</div>
                      <div className="text-[9px] text-gray-500">도착 {formatTrainTime(train.arrPlandTime)}</div>
                    </div>
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
