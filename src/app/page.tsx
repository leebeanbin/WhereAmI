'use client';

import { useMemo, useState, useEffect } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { useTrackingFacade } from '@/application/facades/useTrackingFacade';
import { GeolocationAdapter } from '@/infrastructure/adapters/GeolocationAdapter';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import StationBillboard from '@/components/StationBillboard';
import JourneyTicket from '@/components/JourneyTicket';
import TourismNewsTicker from '@/components/TourismNewsTicker';
import PixelToast from '@/components/PixelToast';
import AdventureGuidePanel from '@/components/AdventureGuidePanel';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Next.js 환경에서 지도 컴포넌트를 클라이언트 사이드에서만 렌더링하도록 강제합니다.
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function Home() {
  const {
    currentLocation, route, isTracking, detectedMode, confirmedMode, emaSpeed,
    setDetectedMode, setConfirmedMode, selectedStation, loadPersistedJourney
  } = useLocationStore();
  
  const locationAdapter = useMemo(() => new GeolocationAdapter(), []);
  const { startTracking, stopTracking } = useTrackingFacade(locationAdapter);

  // 브라우저 새로고침 시 로컬스토리지에 저장된 이전 여정 복원
  useEffect(() => {
    loadPersistedJourney();
  }, [loadPersistedJourney]);

  // 모험 가이드 모달 상태
  const [showGuide, setShowGuide] = useState(false);

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

  return (
    <main className="flex flex-col h-dvh w-full bg-[#e4ebe4] text-retro-dark font-neodgm p-4 md:p-6 overflow-hidden relative scanlines">
      <TourismNewsTicker />
      <PixelToast />
      
      {/* Retro Header */}
      <div className="nes-container is-rounded bg-retro-cream border-retro-thick p-4 mb-3 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-3">
          <div className="flex items-center gap-4">
            <span className="text-retro-title-md retro-arcade-logo select-none">
              WHERE AM I?
            </span>
            <span className="nes-badge shrink-0"><span className="is-success text-retro-tiny uppercase font-bold tracking-wider">8-BIT FOREST QUEST</span></span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              {currentLocation ? (
                <span className="flex items-center gap-1.5 text-retro-green text-retro-body-bold">
                  <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0 animate-gps-blink" alt="gps" />
                  <span>GPS ACTIVE</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-retro-red text-retro-body-bold">
                  <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0 opacity-40 animate-pulse" alt="gps searching" />
                  <span>GPS SEARCHING</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuide(true)}
                className="nes-btn is-primary text-retro-caption-bold py-1 px-3 shrink-0 flex items-center justify-center gap-1.5 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]"
              >
                <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated shrink-0" alt="guide" />
                <span>모험 가이드</span>
              </button>
              <Link href="/history" className="nes-btn is-warning text-retro-caption-bold py-1 px-3 shrink-0 flex items-center justify-center gap-1.5 shadow-[1px_1px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[1px]" style={{ textDecoration: 'none' }}>
                <img src="/icons/book_icon.png" className="w-4 h-4 pixelated shrink-0" alt="archive" />
                <span>보관함</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 nes-container is-rounded relative mb-3 bg-[#c4d5c4] shadow-inner p-1 overflow-hidden min-h-[300px] border-retro-thick">
        <MapComponent />
        
        {/* Retro Grid Background Simulation (if map is not loaded) */}
        {!currentLocation && (
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#2d6a4f 1.5px, transparent 1.5px), linear-gradient(90deg, #2d6a4f 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        )}
        
        {/* 실시간 속도 HUD 위젯 — 클릭하면 닫힘 */}
        {renderHud && (
            <div
              className={`absolute top-4 right-4 z-20 cursor-pointer group ${hudExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}
              onClick={() => setShowHud(false)}
              title="클릭하면 닫힘"
            >
                <div 
                  className="nes-container is-rounded bg-retro-cream p-3 text-right border-retro-thick text-retro-green drop-shadow-[4px_4px_0_rgba(0,0,0,1)] !m-0 relative"
                  style={{ backgroundColor: '#fbfbf5' }}
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
                </div>
            </div>
        )}
        {/* HUD가 닫힌 상태일 때 다시 켜는 소형 버튼 */}
        {renderMiniButton && (
            <button
              onClick={() => setShowHud(true)}
              className={`absolute top-4 right-4 z-20 bg-retro-cream border-retro-thin px-2.5 py-1.5 text-retro-caption-bold text-retro-green drop-shadow-[2px_2px_0_rgba(0,0,0,1)] hover:bg-[#eaeae0] transition-colors flex items-center justify-center gap-1.5 ${miniExiting ? 'animate-pixel-out' : 'animate-pixel-in'}`}
              style={{ backgroundColor: '#fbfbf5' }}
            >
              <img src="/icons/tree_hud.png" className="w-4 h-4 pixelated shrink-0" alt="speed" />
              <span>{emaSpeed.toFixed(0)} km/h</span>
            </button>
        )}

        {/* 정류장 전광판 UI 오버레이 */}
        <StationBillboard />
        
        {/* 여정 종료 영수증 모달 */}
        <JourneyTicket />
      </div>

      {/* 🎮 현재 퀘스트 (Current Quest) 대화창 */}
      <div className="nes-container is-rounded bg-retro-moss text-retro-green border-retro-thick p-3 mb-3 quest-board-active flex items-start gap-3 animate-pixel-in relative">
        <img src="/icons/controller_icon.png" className="w-7 h-7 pixelated shrink-0 select-none mt-0.5" alt="quest controller" />
        <div className="flex-1 min-w-0">
          <div className="text-retro-caption-bold text-retro-wood uppercase tracking-wider mb-0.5">CURRENT QUEST</div>
          <p className="text-retro-body text-retro-dark">
            {!isTracking ? (
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
              <div className="nes-container is-rounded bg-retro-cream text-retro-dark p-4 shadow-[10px_10px_0_0_rgba(0,0,0,0.15)] border-retro-thick">
                  <div className="flex justify-center mb-3">
                      <img src={TransportIconFactory.getIconPath(detectedMode)} className="w-12 h-12 pixelated drop-shadow-md border border-gray-200 p-1 bg-white rounded" alt="detected" />
                  </div>
                  <p className="text-retro-body mb-4 text-center leading-relaxed text-retro-dark">
                      앗! 속도 주파수(<span className="text-retro-wood font-bold">{emaSpeed.toFixed(1)}km/h</span>)가 변했습니다.<br/><br/>
                      혹시 지금 <b>{TransportIconFactory.getModeText(detectedMode)}</b>(으)로 차원이동 중이십니까?
                  </p>
                  <div className="flex justify-between mt-4 gap-3">
                      <button type="button" className="nes-btn is-error text-retro-caption-bold px-2 py-1.5 flex-1" onClick={() => setDetectedMode(null)}>아니오</button>
                      <button type="button" className="nes-btn is-primary text-retro-caption-bold px-2 py-1.5 flex-1" onClick={() => setConfirmedMode(detectedMode)}>예(변경)</button>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Controls */}
      <div className="nes-container is-rounded bg-retro-cream border-retro-thick p-4 flex flex-col items-center">
         <div className="flex w-full items-center justify-between mb-3 border-b-2 border-gray-200 pb-2 text-retro-body">
             <div className="text-center flex items-center gap-2">
                 <span className="text-retro-gray">현재 탐색 수단:</span>
                 <img src={TransportIconFactory.getIconPath(confirmedMode)} className="w-5 h-5 pixelated drop-shadow-md" alt="mode" />
                 <span className="nes-text is-primary font-bold text-retro-wood">{TransportIconFactory.getModeText(confirmedMode)}</span>
             </div>
             <div className="text-right">
                <span className="text-retro-caption text-retro-gray">기록 누적: {route.length} pts</span>
             </div>
         </div>
         
         <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`w-full nes-btn ${isTracking ? 'is-error' : 'is-success'} shadow-[0_5px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[5px] transition-all duration-150 py-2.5 text-retro-subtitle flex items-center justify-center`}
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
    </main>
  );
}
