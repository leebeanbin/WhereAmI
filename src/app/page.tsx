'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { useTrackingFacade } from '@/application/facades/useTrackingFacade';
import { GeolocationAdapter } from '@/infrastructure/adapters/GeolocationAdapter';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { getDistanceFromLatLonInKm, formatDistance } from '@/application/utils/geoUtils';
import { playCoinSound, playPowerDownSound, playClickSound } from '@/application/utils/audioUtils';
import StationBillboard from '@/components/StationBillboard';
import JourneyTicket from '@/components/JourneyTicket';
import TourismNewsTicker from '@/components/TourismNewsTicker';
import PixelToast from '@/components/PixelToast';
import AdventureGuidePanel from '@/components/AdventureGuidePanel';
import MapPlaceSheet from '@/components/MapPlaceSheet';
import NearbyRecommendSheet from '@/components/NearbyRecommendSheet';
import InstallPromptBanner from '@/components/InstallPromptBanner';
import { usePushNotification } from '@/application/hooks/usePushNotification';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Next.js 환경에서 지도 컴포넌트를 클라이언트 사이드에서만 렌더링하도록 강제합니다.
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function Home() {
  const {
    currentLocation, route, isTracking, detectedMode, confirmedMode, emaSpeed,
    setDetectedMode, setConfirmedMode, selectedStation, loadPersistedJourney,
    soundEnabled, scanlineEnabled, gpsPermissionStatus,
    navigationTarget, setNavigationTarget,
    navMode, setNavMode,
    setSoundEnabled, setScanlineEnabled, setGpsPermissionStatus,
    currentRegion,
  } = useLocationStore();
  
  const locationAdapter = useMemo(() => new GeolocationAdapter(), []);
  const { startTracking, stopTracking } = useTrackingFacade(locationAdapter);

  // 브라우저 새로고침 시 로컬스토리지에 저장된 이전 여정 복원
  useEffect(() => {
    loadPersistedJourney();
  }, [loadPersistedJourney]);

  // GPS 권한 상태 감지
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setGpsPermissionStatus(result.state);
          result.onchange = () => {
            setGpsPermissionStatus(result.state);
          };
        })
        .catch(() => {
          setGpsPermissionStatus('unknown');
        });
    }
  }, [setGpsPermissionStatus]);

  const { sendPush } = usePushNotification();

  // 모험 가이드 모달 상태
  const [showGuide, setShowGuide] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  // 라이브 경과 타이머 (모험 중 매 초 업데이트)
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isTracking) { setElapsedSec(0); return; }
    const id = setInterval(() => {
      if (route.length < 2) return;
      setElapsedSec(Math.floor((Date.now() - route[0].time) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isTracking, route]);

  // 라이브 누적 이동 거리
  const liveDistanceKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      total += getDistanceFromLatLonInKm(
        route[i - 1].lat, route[i - 1].lng,
        route[i].lat, route[i].lng,
      );
    }
    return total;
  }, [route]);

  // HUD 위젯 표시 상태: 모험 시작 시마다 다시 보여줌
  const [showHud, setShowHud] = useState(true);
  useEffect(() => { if (isTracking) setShowHud(true); }, [isTracking]);

  const [renderHud, setRenderHud] = useState(false);
  const [hudExiting, setHudExiting] = useState(false);
  const [renderMiniButton, setRenderMiniButton] = useState(false);
  const [miniExiting, setMiniExiting] = useState(false);

  useEffect(() => {
    if (isTracking && currentLocation && showHud) {
      setRenderHud(true);
      setHudExiting(false);
    } else if (renderHud) {
      setHudExiting(true);
      const timer = setTimeout(() => {
        setRenderHud(false);
        setHudExiting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTracking, currentLocation, showHud, renderHud]);

  useEffect(() => {
    if (isTracking && currentLocation && !showHud) {
      setRenderMiniButton(true);
      setMiniExiting(false);
    } else if (renderMiniButton) {
      setMiniExiting(true);
      const timer = setTimeout(() => {
        setRenderMiniButton(false);
        setMiniExiting(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTracking, currentLocation, showHud, renderMiniButton]);

  const handleStartTracking = () => {
    playCoinSound();
    startTracking();
  };

  const handleStopTracking = () => {
    playPowerDownSound();
    stopTracking();
    // 모험 종료 Push 알림 전송
    if (liveDistanceKm > 0) {
      sendPush(
        '모험 완료! 🎉',
        `총 ${(liveDistanceKm).toFixed(2)}km 달성했습니다. 여정을 확인해보세요!`,
        '/history',
      );
    }
  };

  return (
    <main
      className={`w-full bg-gray-100 text-retro-dark font-neodgm safe-inset overflow-hidden relative ${scanlineEnabled ? 'crt-active scanlines crt-flicker crt-curve' : ''}`}
      style={{ height: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr auto auto' }}
    >
      <TourismNewsTicker />
      <PixelToast />
      
      {/* Retro Header - Compact Arcade Header */}
      <div className="bg-retro-cream rounded-sm p-2 sm:p-3 mb-2 shadow-sm shrink-0 border-2 border-black">
        {/* 행 1: 로고 + GPS + 설정 토글 */}
        <div className="flex items-center justify-between w-full gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-retro-title-md retro-arcade-logo select-none shrink-0">WHERE AM I?</span>
            <span className="hidden sm:inline-block bg-retro-green text-white text-retro-tiny uppercase font-bold tracking-wider px-1.5 py-0.5 border-2 border-black shadow-[1px_1px_0_#000]">8-BIT</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {currentLocation ? (
              <span className="flex items-center gap-1 text-retro-green text-retro-body-bold">
                <img src="/icons/tree_hud.png" className="w-3.5 h-3.5 pixelated shrink-0 animate-gps-blink" alt="gps" />
                <span className="hidden xs:inline sm:inline">GPS</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-retro-red text-retro-body-bold">
                <img src="/icons/tree_hud.png" className="w-3.5 h-3.5 pixelated shrink-0 opacity-40 animate-pulse" alt="gps" />
                <span className="hidden xs:inline sm:inline">GPS?</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => { const v = !soundEnabled; setSoundEnabled(v); if (v) setTimeout(() => playCoinSound(), 60); else playClickSound(); }}
              className={`pixel-btn-3d pixel-btn-3d-sm shrink-0 flex items-center justify-center ${soundEnabled ? 'is-success' : 'is-error'}`}
              title={soundEnabled ? '소리 끄기' : '소리 켜기'}
              style={{ width: '32px', height: '28px' }}
            >
              <span className="text-xs">{soundEnabled ? '🔊' : '🔇'}</span>
            </button>
            <button
              type="button"
              onClick={() => { playClickSound(); setScanlineEnabled(!scanlineEnabled); }}
              className={`pixel-btn-3d pixel-btn-3d-sm shrink-0 flex items-center justify-center ${scanlineEnabled ? 'is-success' : 'is-error'}`}
              title={scanlineEnabled ? 'CRT 필터 끄기' : 'CRT 필터 켜기'}
              style={{ width: '32px', height: '28px' }}
            >
              <span className="text-xs">📺</span>
            </button>
          </div>
        </div>
        {/* 행 2: 모험 가이드 + 주변 탐색 + 보관함 */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => { playClickSound(); setShowGuide(true); }}
            className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-caption-bold py-1 px-3 flex-1 flex items-center justify-center gap-1.5"
          >
            <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated shrink-0" alt="guide" />
            <span>모험 가이드</span>
          </button>
          <button
            onClick={() => { playClickSound(); setShowNearby(true); }}
            className="pixel-btn-3d pixel-btn-3d-sm is-success text-retro-caption-bold py-1 px-3 flex-1 flex items-center justify-center gap-1.5"
          >
            <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated shrink-0" alt="nearby" />
            <span>주변 탐색</span>
          </button>
          <Link
            href="/history"
            onClick={() => playClickSound()}
            className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1 px-3 flex-1 flex items-center justify-center gap-1.5"
            style={{ textDecoration: 'none' }}
          >
            <img src="/icons/book_icon.png" className="w-4 h-4 pixelated shrink-0" alt="archive" />
            <span>보관함</span>
          </Link>
        </div>
      </div>

      {/* Map Area - 100% dynamic viewport fit */}
      <div className="relative mb-2 bg-[#c4d5c4] shadow-inner p-1 overflow-hidden border-4 border-black rounded-sm" style={{ minHeight: 0 }}>
        <MapComponent />
        
        {/* Retro Grid Background Simulation (if map is not loaded) */}
        {!currentLocation && (
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#2d6a4f 1.5px, transparent 1.5px), linear-gradient(90deg, #2d6a4f 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        )}
        
        {/* 실시간 속도 HUD 위젯 — 클릭하면 닫힘 */}
        {renderHud && (
            <div
              className={`absolute top-4 right-4 z-20 cursor-pointer group ${hudExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}
              onClick={() => { playClickSound(); setShowHud(false); }}
              title="클릭하면 닫힘"
            >
                <div
                  className="bg-retro-cream rounded-sm p-3 text-right border-retro-thick text-retro-green drop-shadow-[4px_4px_0_rgba(0,0,0,1)] relative"
                >
                    {/* 닫기 X 힌트 표시 (hover 시) */}
                    <span className="absolute top-1 left-2 text-retro-tiny text-retro-gray opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      탭해서 닫기
                    </span>
                    <p className="text-retro-caption-bold text-retro-green mb-1 uppercase tracking-widest">SPEED</p>
                    <p className="text-2xl font-neodgm leading-none">
                      <span className="text-retro-red font-bold">{emaSpeed.toFixed(1)}</span>
                      <span className="text-retro-caption text-retro-gray ml-1">km/h</span>
                    </p>
                    <p className="text-retro-tiny text-retro-gray mt-1.5 border-t border-dashed border-gray-200 pt-1">
                      RAW {(route.length > 0 ? route[route.length-1].speedKmh : 0).toFixed(1)}
                    </p>
                    {elapsedSec > 0 && (
                      <p className="text-retro-tiny text-retro-wood mt-1 font-bold tracking-widest">
                        {String(Math.floor(elapsedSec / 3600)).padStart(2, '0')}:
                        {String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0')}:
                        {String(elapsedSec % 60).padStart(2, '0')}
                      </p>
                    )}
                    {currentRegion && (
                      <p className="text-retro-tiny text-retro-wood mt-1 font-bold tracking-wide border-t border-dashed border-gray-200 pt-1">
                        📍 {currentRegion}
                      </p>
                    )}
                </div>
            </div>
        )}
        {/* HUD가 닫힌 상태일 때 다시 켜는 소형 버튼 */}
        {renderMiniButton && (
            <button
              onClick={() => { playClickSound(); setShowHud(true); }}
              className={`absolute top-4 right-4 z-20 bg-retro-cream border-retro-thin px-2.5 py-1.5 text-retro-caption-bold text-retro-green drop-shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-[#eaeae0] transition-colors flex items-center justify-center gap-1.5 ${miniExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}
            >
              <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0" alt="speed" />
              <span>{emaSpeed.toFixed(0)} km/h</span>
              {elapsedSec > 0 && (
                <span className="text-retro-tiny text-retro-wood opacity-90">
                  {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                </span>
              )}
            </button>
        )}

        {/* 인앱 길찾기 네비게이션 바 */}
        {navigationTarget && currentLocation && (() => {
          const navDist = getDistanceFromLatLonInKm(
            currentLocation.lat, currentLocation.lng,
            navigationTarget.lat, navigationTarget.lng,
          );
          const walkMin = Math.max(1, Math.round(navDist / 4 * 60));
          const carMin = Math.max(1, Math.round(navDist / 40 * 60));
          const transitLink = `https://map.kakao.com/link/to/${encodeURIComponent(navigationTarget.name)},${navigationTarget.lat},${navigationTarget.lng}`;
          return (
            <div className="absolute bottom-4 left-2 right-14 z-10 bg-retro-cream border-2 border-black rounded-sm p-2.5 shadow-[4px_4px_0_rgba(0,0,0,1)]">
              {/* 교통수단 탭 */}
              <div className="flex gap-1 mb-2 select-none">
                {(['walk', 'car', 'transit'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { playClickSound(); setNavMode(m); }}
                    className={`pixel-btn-3d pixel-btn-3d-sm text-retro-tiny py-0.5 px-2 flex-1 flex items-center justify-center gap-1 ${navMode === m ? 'is-primary' : 'is-cream'}`}
                  >
                    <img
                      src={m === 'walk' ? '/icons/walk_man.png' : m === 'car' ? '/icons/compass_icon.png' : '/icons/bus_stop.png'}
                      className="w-3 h-3 pixelated shrink-0"
                      alt={m}
                    />
                    <span>{m === 'walk' ? '도보' : m === 'car' ? '자동차' : '대중교통'}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-retro-body-bold text-retro-wood truncate">★ {navigationTarget.name}</div>
                  <div className="text-retro-caption text-retro-green mt-0.5">
                    {navMode === 'transit'
                      ? `${formatDistance(navDist)} · 카카오맵에서 경로 확인`
                      : navMode === 'car'
                        ? `${formatDistance(navDist)} · 자동차 약 ${carMin}분`
                        : `${formatDistance(navDist)} · 도보 약 ${walkMin}분`}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {navMode === 'transit' ? (
                    <a
                      href={transitLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClickSound()}
                      className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1 px-1.5 flex items-center justify-center gap-1"
                      style={{ textDecoration: 'none' }}
                    >
                      <img src="/icons/bus_stop.png" className="w-3 h-3 pixelated shrink-0" alt="transit" />
                      <span>카카오맵</span>
                    </a>
                  ) : (
                    <a
                      href={navigationTarget.kakaoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playClickSound()}
                      className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1 px-1.5 flex items-center justify-center gap-1"
                      style={{ textDecoration: 'none' }}
                    >
                      <img src="/icons/compass_icon.png" className="w-3 h-3 pixelated shrink-0" alt="kakao" />
                      <span>카카오맵</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setNavigationTarget(null); }}
                    className="pixel-btn-3d pixel-btn-3d-sm is-error text-retro-caption-bold py-1 px-1.5 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 지도 임의 위치 클릭 시트 */}
        <MapPlaceSheet />

        {/* 정류장 전광판 UI 오버레이 */}
        <StationBillboard />
        
        {/* 여정 종료 영수증 모달 */}
        <JourneyTicket />
      </div>

      {/* 🎮 현재 퀘스트 (Current Quest) 대화창 - Compact layout fit */}
      <div className="bg-retro-moss text-retro-green rounded-sm p-2 mb-2 quest-board-active flex items-start gap-2.5 animate-pixel-in relative shrink-0 border-2 border-black">
        <img src="/icons/controller_icon.png" className="w-7 h-7 pixelated shrink-0 select-none mt-0.5" alt="quest controller" />
        <div className="flex-1 min-w-0">
          <div className="text-retro-caption-bold text-retro-wood uppercase tracking-wider mb-0.5">CURRENT QUEST</div>
          <p className="text-retro-body text-retro-dark">
            {gpsPermissionStatus === 'denied' ? (
              <span className="text-retro-red font-bold">
                ⚠️ [GPS 권한 차단됨] 기기 또는 브라우저의 위치 권한이 차단되었습니다! 주소창 왼쪽 설정을 클릭해 위치 권한을 &quot;허용&quot;으로 활성화해야 모험 퀘스트 진행이 가능합니다.
              </span>
            ) : !isTracking ? (
              "아래의 대형 '모험 시작' 버튼을 눌러 새로운 retro 여정을 활성화하고 실시간 이동 추적을 개시하세요!"
            ) : !currentLocation ? (
              "정밀 GPS 위성 신호를 대기하고 있습니다. 하늘이 잘 보이고 주변 건물 간섭이 적은 곳으로 이동하여 전파를 수신하세요!"
            ) : selectedStation ? (
              `[${selectedStation.stationName}]의 차원 관문(전광판)이 개방되었습니다! 실시간 도착 정보를 해독하고 '스탬프 찍기'를 통해 탐험을 인증하십시오!`
            ) : (
              "모험이 진행 중입니다! 도보, 버스, 지하철 등으로 속도를 올리고 주변 정류장 마커를 클릭하여 획득할 스탬프를 관측하세요. 우측 상단의 '모험 가이드'로 현재 지역 문화 탐방 정보를 획득하는 것도 잊지 마세요!"
            )}
          </p>
        </div>
      </div>

      {/* Mode Change Popup Widget */}
      {detectedMode && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-sm animate-pop-in">
              <div className="bg-retro-cream rounded-sm text-retro-dark p-4 shadow-[10px_10px_0_0_rgba(0,0,0,0.15)] border-retro-thick">
                  <div className="flex justify-center mb-3">
                      <img src={TransportIconFactory.getIconPath(detectedMode)} className="w-12 h-12 pixelated drop-shadow-md border border-gray-200 p-1 bg-white rounded" alt="detected" />
                  </div>
                  <p className="text-retro-body mb-4 text-center leading-relaxed text-retro-dark">
                      앗! 속도 주파수(<span className="text-retro-wood font-bold">{emaSpeed.toFixed(1)}km/h</span>)가 변했습니다.<br/><br/>
                      혹시 지금 <b>{TransportIconFactory.getModeText(detectedMode)}</b>(으)로 차원이동 중이십니까?
                  </p>
                  <div className="flex justify-between mt-4 gap-3">
                      <button type="button" className="pixel-btn-3d is-error text-retro-caption-bold py-2 flex-1 text-sm font-bold" onClick={() => { playClickSound(); setDetectedMode(null); }}>아니오</button>
                      <button type="button" className="pixel-btn-3d is-primary text-retro-caption-bold py-2 flex-1 text-sm font-bold" onClick={() => { playClickSound(); setConfirmedMode(detectedMode); }}>예(변경)</button>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Controls - Compact Layout Lock */}
      <div className="bg-retro-cream rounded-sm p-2 sm:p-3 flex flex-col items-center shrink-0 border-2 border-black">
         <div className="flex w-full items-center justify-between mb-3 border-b-2 border-gray-200 pb-2 text-retro-body">
             <div className="text-center flex items-center gap-2">
                 <span className="text-retro-gray">현재 탐색 수단:</span>
                 <img src={TransportIconFactory.getIconPath(confirmedMode)} className="w-5 h-5 pixelated drop-shadow-md" alt="mode" />
                 <span className="nes-text is-primary font-bold text-retro-wood">{TransportIconFactory.getModeText(confirmedMode)}</span>
             </div>
             <div className="text-right">
                <span className="text-retro-caption text-retro-gray">
                  {isTracking && liveDistanceKm > 0
                    ? `${formatDistance(liveDistanceKm)} · ${route.length} pts`
                    : `기록 누적: ${route.length} pts`}
                </span>
             </div>
         </div>
         
         <button
            onClick={isTracking ? handleStopTracking : handleStartTracking}
            className={`w-full pixel-btn-3d ${isTracking ? 'is-error' : 'is-success'} py-2.5 text-lg font-bold flex items-center justify-center`}
         >
            {isTracking ? (
              <span className="flex items-center justify-center gap-2">
                <img src="/icons/stop_icon.png" className="w-4 h-4 pixelated shrink-0" alt="stop" />
                <span>모험 종료</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <img src="/icons/play_icon.png" className="w-4 h-4 pixelated shrink-0" alt="play" />
                <span>모험 시작</span>
              </span>
            )}
         </button>
      </div>

      {/* 모험 가이드 오버레이 */}
      {showGuide && (
        <AdventureGuidePanel onClose={() => setShowGuide(false)} />
      )}

      {/* 주변 탐색 시트 */}
      {showNearby && (
        <NearbyRecommendSheet onClose={() => setShowNearby(false)} />
      )}

      {/* 설치 유도 + Push 알림 배너 */}
      <InstallPromptBanner />
    </main>
  );
}
