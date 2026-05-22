'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { useFavoriteStations } from '@/application/hooks/useFavoriteStations';
import { TransportSchedule } from '@/domain/interfaces/IPublicTransportAdapter';
import { MS_PER_MINUTE } from '@/constants/math';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import type { ApiBody } from '@/lib/apiResponse';
import type { SubwayArrivalDto, TrainDto } from '@/application/dtos/TransportDto';
import type { TourismItemDto, TourismListDto } from '@/application/dtos/TourismDto';

type Tab = 'bus' | 'subway' | 'train' | 'tour';

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
  const {
    selectedStation,
    setSelectedStation,
    cityCode,
    setToast,
    isTracking,
    route,
    checkInStation
  } = useLocationStore();
  const { isFavorite, toggle: toggleFavorite } = useFavoriteStations();
  const [activeTab, setActiveTab] = useState<Tab>('bus');
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [subwayArrivals, setSubwayArrivals] = useState<SubwayArrivalDto[]>([]);
  const [trains, setTrains] = useState<TrainDto[]>([]);
  const [attractions, setAttractions] = useState<TourismItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 로컬 렌더링 상태 및 퇴장 애니메이션 제어
  const [stationToRender, setStationToRender] = useState(selectedStation);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (selectedStation) {
      setStationToRender(selectedStation);
      setIsExiting(false);
    } else {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setStationToRender(null);
        setIsExiting(false);
      }, 350); // slide-up-out 지속 시간과 일치
      return () => clearTimeout(timer);
    }
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation) return;
    setActiveTab(selectedStation.type === 'subway' ? 'subway' : 'bus');
    setSchedules([]);
    setSubwayArrivals([]);
    setTrains([]);
    setAttractions([]);
    setFetchError(null);
  }, [selectedStation]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'bus') return;

    setLoading(true);
    setFetchError(null);
    fetch(`/api/transport?stationId=${selectedStation.stationId}&cityCode=${cityCode}`)
      .then(res => res.json() as Promise<ApiBody<any>>)
      .then(body => {
        if (body.success) {
          const resData = body.data;
          if (Array.isArray(resData)) {
            setSchedules(resData);
          } else {
            setSchedules(resData.items || []);
            if (resData.warning) setFetchError(resData.warning);
          }
        } else {
          setFetchError('버스 정보를 불러오지 못했습니다.');
        }
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
      .then(res => res.json() as Promise<ApiBody<any>>)
      .then(body => {
        if (body.success) {
          const resData = body.data;
          if (Array.isArray(resData)) {
            setSubwayArrivals(resData);
          } else {
            setSubwayArrivals(resData.items || []);
            if (resData.warning) setFetchError(resData.warning);
          }
        } else {
          setFetchError('지하철 정보를 불러오지 못했습니다.');
        }
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
      .then(res => res.json() as Promise<ApiBody<any>>)
      .then(body => {
        if (body.success) {
          const resData = body.data;
          if (Array.isArray(resData)) {
            setTrains(resData);
          } else {
            setTrains(resData.items || []);
            if (resData.warning) setFetchError(resData.warning);
          }
        } else {
          setFetchError('열차 정보를 불러오지 못했습니다.');
        }
      })
      .catch(() => setFetchError('열차 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedStation, activeTab, retryKey]);

  useEffect(() => {
    if (!selectedStation || activeTab !== 'tour') return;

    setLoading(true);
    setFetchError(null);
    fetch(`/api/tourism?lat=${selectedStation.lat}&lng=${selectedStation.lng}&radius=2000`)
      .then(res => res.json() as Promise<ApiBody<TourismListDto>>)
      .then(body => {
        if (body.success) {
          setAttractions(body.data.items || []);
          if (body.data.warning) setFetchError(body.data.warning);
        } else {
          setFetchError('주변 관광 정보를 불러오지 못했습니다.');
        }
      })
      .catch(() => setFetchError('주변 관광 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [selectedStation, activeTab, retryKey]);

  if (!stationToRender) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[70] md:w-[420px] max-w-[calc(100vw-2rem)] ${isExiting ? 'animate-slide-up-out' : 'animate-slide-up'}`}>
      <div className="nes-container is-rounded bg-retro-cream text-retro-dark font-neodgm shadow-2xl relative border-retro-thick p-4 md:p-5 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: 'none', backgroundColor: '#fbfbf5' }}>
        {/* 닫기 버튼 */}
        <button
          onClick={() => setSelectedStation(null)}
          className="absolute top-3 right-3 text-black bg-white hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-sm border-retro-thin pixel-btn shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
        >
          <span className="text-retro-body-bold leading-none select-none">X</span>
        </button>

        {/* 상단 헤더 영역 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3 border-b-4 border-gray-300 pb-2.5 w-full">
          <h3 className="text-retro-subtitle text-retro-wood flex items-center gap-1.5 min-w-0">
            <img 
              src={TransportIconFactory.getStationMarkerPath(stationToRender.type)} 
              className="w-5 h-5 pixelated shrink-0" 
              alt="station type" 
            />
            <span className="truncate">{stationToRender.stationName}</span>
          </h3>
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(stationToRender.stationName)},${stationToRender.lat},${stationToRender.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nes-btn is-primary text-retro-caption-bold px-2.5 py-1 text-center flex items-center justify-center gap-1.5 shrink-0 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
              style={{ textDecoration: 'none' }}
            >
              <img src="/icons/walk_man.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="directions" />
              <span>가는방법</span>
            </a>
            <button
              onClick={() => {
                const wasFavorite = isFavorite(stationToRender.stationId);
                toggleFavorite(stationToRender.stationId);
                setToast({
                  message: wasFavorite ? '즐겨찾기에서 제거했습니다.' : '즐겨찾기에 추가했습니다!',
                  type: wasFavorite ? 'error' : 'success',
                });
              }}
              className={`nes-btn text-retro-caption-bold px-2.5 py-1 flex items-center justify-center gap-1.5 shrink-0 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px] ${isFavorite(stationToRender.stationId) ? 'is-warning' : ''}`}
            >
              <img src="/icons/book_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="favorite" />
              <span>{isFavorite(stationToRender.stationId) ? '단골' : '단골 추가'}</span>
            </button>
            <button
              onClick={() => {
                if (!isTracking) {
                  setToast({
                    message: '모험을 시작해야 기록을 남길 수 있습니다!',
                    type: 'error',
                  });
                  return;
                }
                if (route.length === 0) {
                  setToast({
                    message: 'GPS 신호 수신 후 체크인할 수 있습니다.',
                    type: 'error',
                  });
                  return;
                }
                checkInStation(stationToRender.stationId, stationToRender.stationName);
                setToast({
                  message: `[${stationToRender.stationName}] 체크인 완료!`,
                  type: 'success',
                });
              }}
              className="nes-btn is-success text-retro-caption-bold px-2.5 py-1 flex items-center justify-center gap-1.5 shrink-0 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
            >
              <img src="/icons/bus_stop.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="record" />
              <span>이곳에 기록</span>
            </button>
          </div>
        </div>

        {/* 탭 버튼 */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveTab('bus')}
            className={`nes-btn text-retro-caption-bold px-2.5 py-1 flex items-center gap-1.5 shrink-0 ${activeTab === 'bus' ? 'is-primary' : ''}`}
          >
            <img src="/icons/bus_blue.png" className="w-4 h-4 pixelated shrink-0" alt="bus tab" />
            <span>버스</span>
          </button>
          <button
            onClick={() => setActiveTab('subway')}
            className={`nes-btn text-retro-caption-bold px-2.5 py-1 flex items-center gap-1.5 shrink-0 ${activeTab === 'subway' ? 'is-primary' : ''}`}
          >
            <img src="/icons/subway_station.png" className="w-4 h-4 pixelated shrink-0" alt="subway tab" />
            <span>지하철</span>
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`nes-btn text-retro-caption-bold px-2.5 py-1 flex items-center gap-1.5 shrink-0 ${activeTab === 'train' ? 'is-primary' : ''}`}
          >
            <img src="/icons/train_station.png" className="w-4 h-4 pixelated shrink-0" alt="train tab" />
            <span>열차</span>
          </button>
          <button
            onClick={() => setActiveTab('tour')}
            className={`nes-btn text-retro-caption-bold px-2.5 py-1 flex items-center gap-1.5 shrink-0 ${activeTab === 'tour' ? 'is-primary' : ''}`}
          >
            <img src="/icons/banana.png" className="w-4 h-4 pixelated shrink-0" alt="tour tab" />
            <span>추천 명소</span>
          </button>
        </div>

        {/* 전광판 메인 영역 */}
        <div key={activeTab} className="h-32 md:h-36 max-h-[30vh] overflow-y-auto pr-2 animate-tab-fade flex flex-col gap-2" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="text-center mt-8 animate-pulse text-retro-body-bold text-retro-green flex flex-col items-center gap-2">
              <img src="/icons/compass_icon.png" className="w-6 h-6 pixelated animate-spin" alt="loading" />
              <span>신호 수신 중...</span>
            </div>
          ) : fetchError ? (
            <div className="text-center mt-6">
              <p className="text-retro-body-bold text-retro-red mb-3">{fetchError}</p>
              <button
                onClick={() => setRetryKey(k => k + 1)}
                className="nes-btn is-error text-retro-caption-bold px-2.5 py-1 flex items-center justify-center gap-1.5 mx-auto"
              >
                <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated" alt="retry" />
                <span>재시도</span>
              </button>
            </div>
          ) : activeTab === 'bus' ? (
            schedules.length === 0 ? (
              <div className="text-center mt-8 text-retro-body text-retro-gray italic">도착 예정 정보가 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {schedules.map((schedule, idx) => {
                  const arrivalTime = new Date(schedule.estimatedArrivalTime);
                  const diffMinutes = Math.round((arrivalTime.getTime() - Date.now()) / MS_PER_MINUTE);
                  const displayTime = diffMinutes <= 0 ? '곧 도착' : `${diffMinutes}분 후`;
                  return (
                    <div key={idx} className="flex justify-between items-center bg-retro-moss p-2 border-retro-thin text-retro-dark shadow-[1px_1px_0_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3">
                        <span className="text-retro-title-md text-retro-red font-bold">{schedule.lineNo}</span>
                        <span className="text-retro-caption-bold text-retro-green/70">{schedule.currentStop} 방면</span>
                      </div>
                      <div className="text-retro-body-bold text-retro-wood animate-pulse">{displayTime}</div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'subway' ? (
            subwayArrivals.length === 0 ? (
              <div className="text-center mt-8 text-retro-body text-retro-gray italic">지하철 도착 정보가 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {subwayArrivals.map((arrival, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-retro-moss p-2 border-retro-thin text-retro-dark shadow-[1px_1px_0_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-retro-body-bold text-retro-wood truncate">{arrival.trainLineNm}</span>
                    </div>
                    <div className="text-retro-body-bold text-retro-green shrink-0 animate-pulse">{arrival.arvlMsg2}</div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'train' ? (
            trains.length === 0 ? (
              <div className="text-center mt-8 text-retro-body text-retro-gray italic">출발하는 열차 정보가 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {trains.map((train, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-retro-moss p-2 border-retro-thin text-retro-dark shadow-[1px_1px_0_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2">
                      <span className="text-retro-body-bold text-retro-wood">{train.trainTypeName}</span>
                      <span className="text-retro-body text-retro-green/70">→ {train.arrPlaceName}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-retro-body-bold text-retro-green">{formatTrainTime(train.depPlandTime)}</div>
                      <div className="text-retro-tiny text-retro-green/60 font-medium">도착 {formatTrainTime(train.arrPlandTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            attractions.length === 0 ? (
              <div className="text-center mt-8 text-retro-body text-retro-gray italic">주변 2km 이내 추천 명소가 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {attractions.map((attraction, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-retro-moss p-2 border-retro-thin gap-2 text-retro-dark shadow-[1px_1px_0_rgba(0,0,0,1)]">
                    <div className="flex gap-2.5 items-start min-w-0">
                      {attraction.imageUrl ? (
                        <img 
                          src={attraction.imageUrl} 
                          className="w-10 h-10 rounded object-cover pixelated border-retro-thin shrink-0" 
                          alt="attraction" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#e4ebe4] flex items-center justify-center rounded border-retro-thin shrink-0">
                          <img src="/icons/banana.png" className="w-5 h-5 pixelated" alt="sight" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-retro-body-bold text-retro-wood truncate">{attraction.title}</div>
                        <div className="text-retro-tiny text-retro-green/70 leading-normal truncate">{attraction.address}</div>
                        <div className="text-retro-tiny text-retro-green font-bold mt-0.5">거리: {attraction.dist}m</div>
                      </div>
                    </div>
                    <a
                      href={`https://map.kakao.com/link/to/${encodeURIComponent(attraction.title)},${attraction.mapY},${attraction.mapX}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nes-btn is-warning text-retro-caption-bold py-1 px-1.5 text-center shrink-0 self-center flex items-center gap-1.5 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
                      style={{ textDecoration: 'none' }}
                    >
                      <img src="/icons/walk_man.png" className="w-3 h-3 pixelated shrink-0" alt="go" />
                      <span>길찾기</span>
                    </a>
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
