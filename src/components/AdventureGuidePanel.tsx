'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getDistanceFromLatLonInKm, formatDistance } from '@/application/utils/geoUtils';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import type { TourismItemDto, TourismListDto } from '@/application/dtos/TourismDto';
import type { ApiBody } from '@/lib/apiResponse';
import { TOURISM_FETCH_DISTANCE_KM } from '@/constants/tracking';
import { FORCE_REFETCH_SENTINEL_KM } from '@/constants/math';
import { playClickSound } from '@/application/utils/audioUtils';

interface AdventureGuidePanelProps {
  onClose: () => void;
}

type Tab = 'tour' | 'stations';

export default function AdventureGuidePanel({ onClose }: AdventureGuidePanelProps) {
  const { currentLocation, nearbyStations, setSelectedStation, setNavigationTarget, setToast } = useLocationStore();
  const [activeTab, setActiveTab] = useState<Tab>('tour');
  const [attractions, setAttractions] = useState<TourismItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 로컬 애니메이션 상태
  const [isExiting, setIsExiting] = useState(false);

  // 마지막으로 관광 정보를 불러온 위치 — 패널이 열려 있는 동안 GPS 업데이트마다 재호출 방지
  const lastFetchLocRef = useRef<{ lat: number; lng: number } | null>(null);

  const handleClose = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 현재 위치 기반 관광지 정보 불러오기 (2km 거리 게이트)
  useEffect(() => {
    if (!currentLocation || activeTab !== 'tour') return;

    const distFromLast = lastFetchLocRef.current
      ? getDistanceFromLatLonInKm(
          lastFetchLocRef.current.lat, lastFetchLocRef.current.lng,
          currentLocation.lat, currentLocation.lng,
        )
      : FORCE_REFETCH_SENTINEL_KM;

    // retryKey가 증가했을 때는 거리 무관하게 재조회
    const isRetry = retryKey > 0 && attractions.length === 0 && !loading;
    if (distFromLast < TOURISM_FETCH_DISTANCE_KM && !isRetry) return;

    lastFetchLocRef.current = { lat: currentLocation.lat, lng: currentLocation.lng };
    setLoading(true);
    setError(null);
    setWarning(null);
    fetch(`/api/tourism?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=2000`)
      .then((res) => res.json() as Promise<ApiBody<TourismListDto>>)
      .then((body) => {
        if (body.success) {
          setAttractions(body.data.items);
          const apiWarning = (body.data as any).warning;
          if (apiWarning) setWarning(apiWarning);
        } else {
          setError('추천 명소를 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('추천 명소를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [currentLocation, activeTab, retryKey]);

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${isExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}>
      <div className="nes-container is-rounded bg-retro-cream text-retro-dark font-neodgm shadow-2xl relative w-full max-w-md border-retro-thick p-5 max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-black bg-white hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-sm border-retro-thin pixel-btn shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
        >
          <span className="text-retro-body-bold leading-none select-none">X</span>
        </button>

        {/* 타이틀 */}
        <div className="text-center mb-4 border-b-4 border-gray-300 pb-3">
          <h2 className="text-retro-title-md text-retro-wood font-bold tracking-wider flex items-center justify-center gap-2">
            <img src="/icons/compass_icon.png" className="w-6 h-6 pixelated shrink-0 animate-pulse" alt="compass" />
            <span>모험 & 관광 가이드</span>
          </h2>
          <p className="text-retro-caption-bold text-retro-green/60 mt-1 uppercase tracking-wider">8-Bit Adventure Exploration</p>
        </div>

        {/* 탭 버튼 - 3D 스타일화 (nes-btn 제거 및 완전 독립 pixel-btn-3d화) */}
        <div className="flex gap-2 mb-4 select-none">
          <button
            onClick={() => { playClickSound(); setActiveTab('tour'); }}
            className={`pixel-btn-3d pixel-btn-3d-sm text-retro-caption-bold py-1.5 flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'tour' ? 'is-primary' : 'is-cream'}`}
          >
            <img src="/icons/banana.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="tour" />
            <span>추천 명소</span>
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('stations'); }}
            className={`pixel-btn-3d pixel-btn-3d-sm text-retro-caption-bold py-1.5 flex-1 flex items-center justify-center gap-1.5 ${activeTab === 'stations' ? 'is-primary' : 'is-cream'}`}
          >
            <img src="/icons/bus_stop.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="stations" />
            <span>주변 정류장</span>
          </button>
        </div>

        {/* 가이드 콘텐츠 메인 영역 */}
        <div key={activeTab} className="h-64 sm:h-80 max-h-[42vh] overflow-y-auto pr-1 animate-tab-fade flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
          
          {/* GPS 비활성화 상태 예외 처리 */}
          {!currentLocation ? (
            <div className="text-center py-16 px-4">
              <img src="/icons/compass_icon.png" className="w-10 h-10 mx-auto mb-3 pixelated animate-spin" alt="searching gps" />
              <p className="text-retro-body-bold text-retro-red mb-1">GPS 신호를 검색 중입니다.</p>
              <p className="text-retro-caption text-retro-green/70 leading-normal">
                현재 위치를 수신하면 주변 명소와 정류장 목록이 지도와 가이드에 자동으로 노출됩니다!
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-retro-body-bold text-retro-green animate-pulse flex flex-col items-center gap-2">
              <img src="/icons/compass_icon.png" className="w-6 h-6 pixelated animate-spin" alt="loading" />
              <span>데이터 주파수 수신 중...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-retro-body-bold text-retro-red mb-4">{error}</p>
              <button
                onClick={() => { playClickSound(); setRetryKey(k => k + 1); }}
                className="pixel-btn-3d pixel-btn-3d-sm is-error text-retro-caption-bold py-1.5 px-3 flex items-center justify-center gap-1.5 mx-auto"
              >
                <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated" alt="retry" />
                <span>다시 시도</span>
              </button>
            </div>
          ) : activeTab === 'tour' ? (
            attractions.length === 0 ? (
              <div className="text-center py-16 text-retro-body text-retro-gray italic">
                주변 2km 이내 추천 명소가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {warning && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 px-2 py-1.5 text-retro-caption text-yellow-800 flex items-center gap-1.5">
                    <span className="shrink-0">⚠</span>
                    <span>{warning}</span>
                  </div>
                )}
                {attractions.map((attraction, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-retro-moss p-2 border-retro-thin gap-2.5 shadow-[2px_2px_0_rgba(0,0,0,1)] animate-pixel-in text-retro-dark" style={{ animationDelay: `${idx * 0.04}s` }}>
                    <div className="flex gap-2.5 items-start min-w-0">
                      {attraction.imageUrl ? (
                        <img 
                          src={attraction.imageUrl} 
                          className="w-12 h-12 rounded object-cover pixelated border-retro-thin shrink-0" 
                          alt="attraction" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-retro-moss flex items-center justify-center rounded border-retro-thin shrink-0">
                          <img src="/icons/banana.png" className="w-6 h-6 pixelated animate-pulse" alt="sight" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-retro-body-bold text-retro-wood truncate">{attraction.title}</div>
                        <div className="text-retro-caption text-retro-green/70 mt-0.5 leading-normal truncate">{attraction.address}</div>
                        <div className="text-retro-caption-bold text-retro-green mt-1 flex items-center gap-1.5">
                          <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated" alt="distance" />
                          <span>거리: {attraction.dist}m</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 self-center">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setNavigationTarget({
                            lat: parseFloat(attraction.mapY as string),
                            lng: parseFloat(attraction.mapX as string),
                            name: attraction.title,
                            kakaoLink: `https://map.kakao.com/link/to/${encodeURIComponent(attraction.title)},${attraction.mapY},${attraction.mapX}`,
                          });
                          handleClose();
                        }}
                        className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-caption-bold py-1 px-1.5 flex items-center justify-center gap-1"
                      >
                        <img src="/icons/walk_man.png" className="w-3 h-3 pixelated shrink-0" alt="navigate" />
                        <span>길찾기</span>
                      </button>
                      <a
                        href={`https://map.kakao.com/link/to/${encodeURIComponent(attraction.title)},${attraction.mapY},${attraction.mapX}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => playClickSound()}
                        className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1 px-1.5 text-center flex items-center justify-center gap-1"
                        style={{ textDecoration: 'none' }}
                      >
                        <img src="/icons/compass_icon.png" className="w-3 h-3 pixelated shrink-0" alt="kakao" />
                        <span>카카오맵</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            nearbyStations.length === 0 ? (
              <div className="text-center py-16 text-retro-body text-retro-gray italic">
                내 주변에 감지된 대중교통 정류장이 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {nearbyStations.map((station, idx) => {
                  const distanceKm = getDistanceFromLatLonInKm(
                    currentLocation.lat, currentLocation.lng,
                    station.lat, station.lng
                  );
                  const distFormatted = formatDistance(distanceKm);
                  
                  return (
                    <div key={idx} className="flex justify-between items-center bg-retro-moss p-2 border-retro-thin gap-2 shadow-[2px_2px_0_rgba(0,0,0,1)] animate-pixel-in text-retro-dark" style={{ animationDelay: `${idx * 0.04}s` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={TransportIconFactory.getStationMarkerPath(station.type)} 
                          className="w-5 h-5 pixelated shrink-0" 
                          alt="station type" 
                        />
                        <div className="min-w-0">
                          <div className="text-retro-body-bold text-retro-wood truncate">{station.stationName}</div>
                          <div className="text-retro-caption text-retro-green/70 mt-0.5">거리: {distFormatted}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setNavigationTarget({
                              lat: station.lat,
                              lng: station.lng,
                              name: station.stationName,
                              kakaoLink: `https://map.kakao.com/link/to/${encodeURIComponent(station.stationName)},${station.lat},${station.lng}`,
                            });
                            handleClose();
                          }}
                          className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-caption-bold py-1 px-1.5 text-center flex items-center justify-center gap-1.5"
                        >
                          <img src="/icons/walk_man.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="directions" />
                          <span>길찾기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStation(station);
                            setToast({
                              message: `[${station.stationName}] 전광판 개방! 도착 정보를 확인하세요.`,
                              type: 'success',
                            });
                            // 모험 가이드를 닫아 전광판이 보이도록 함
                            handleClose();
                          }}
                          className="pixel-btn-3d pixel-btn-3d-sm is-success text-retro-caption-bold py-1 px-1.5 flex items-center justify-center gap-1.5"
                        >
                          <img src="/icons/controller_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="billboard" />
                          <span>전광판</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
