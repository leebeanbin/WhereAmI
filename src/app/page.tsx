'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { useTrackingFacade } from '@/application/facades/useTrackingFacade';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import StationBillboard from '@/components/StationBillboard';
import JourneyTicket from '@/components/JourneyTicket';
import TourismNewsTicker from '@/components/TourismNewsTicker';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Next.js 환경에서 지도 컴포넌트를 클라이언트 사이드에서만 렌더링하도록 강제합니다.
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function Home() {
  const { currentLocation, route, isTracking, detectedMode, confirmedMode, emaSpeed, setDetectedMode, setConfirmedMode } = useLocationStore();
  
  // Facade 훅 사용: UI 컴포넌트는 GPS나 수학 공식을 전혀 모르며 오직 오케스트레이션 훅만 호출합니다. (단일 책임 원칙)
  const { startTracking, stopTracking } = useTrackingFacade();

  return (
    <main className="flex flex-col h-screen w-full bg-[#e0e8e0] text-[#212529] font-neodgm p-4 overflow-hidden relative">
      <TourismNewsTicker />
      
      {/* Retro Header */}
      <div className="nes-container is-rounded with-title mb-4 bg-white shadow-sm">
        <p className="title text-blue-600">Where Am I?</p>
        <div className="flex justify-between items-center text-sm">
            <span>나의 모험 기록</span>
            <div className="flex items-center gap-2">
              {currentLocation ? <span className="text-green-500 text-xs">GPS 통신중</span> : <span className="text-red-500 animate-pulse text-xs">GPS 대기중</span>}
              <Link href="/history" className="nes-btn is-warning text-[9px] py-1 px-2">📚 보관함</Link>
            </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 nes-container is-rounded relative mb-4 bg-[#b5d6e0] shadow-inner p-1">
        <MapComponent />
        
        {/* Retro Grid Background Simulation (if map is not loaded) */}
        {!currentLocation && (
           <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        )}
        
        {/* Floating Info Overlay (Retro HUD) */}
        {isTracking && currentLocation && (
            <div className="absolute top-4 right-4 z-20">
                <div className="nes-container is-rounded bg-white/95 p-3 text-right drop-shadow-[4px_4px_0_rgba(0,0,0,1)] !m-0">
                    <p className="text-[10px] text-gray-500 mb-1 font-bold">CURRENT SPEED</p>
                    <p className="text-xl font-neodgm">⚡ <span className="text-red-500">{emaSpeed.toFixed(1)}</span> <span className="text-sm">km/h</span></p>
                    <p className="text-[8px] text-gray-400 mt-2 border-t border-dashed border-gray-300 pt-1">
                      RAW: {(route.length > 0 ? route[route.length-1].speedKmh : 0).toFixed(1)}
                    </p>
                </div>
            </div>
        )}

        {/* 정류장 전광판 UI 오버레이 */}
        <StationBillboard />
        
        {/* 여정 종료 영수증 모달 */}
        <JourneyTicket />
      </div>

      {/* Mode Change Popup Widget */}
      {detectedMode && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-sm animate-bounce">
              <div className="nes-container is-rounded bg-white p-4 shadow-[10px_10px_0_0_rgba(0,0,0,0.5)] border-4 border-black">
                  <div className="flex justify-center mb-2">
                      <img src={TransportIconFactory.getIconPath(detectedMode)} className="w-8 h-8 pixelated drop-shadow-md" alt="detected" />
                  </div>
                  <p className="text-xs mb-4 text-center leading-relaxed">
                      앗! 속도({emaSpeed.toFixed(1)}km/h)가 변했어요.<br/><br/>
                      혹시 지금 <b>{TransportIconFactory.getModeText(detectedMode)}</b>(으)로 이동 중이신가요?
                  </p>
                  <div className="flex justify-between mt-4">
                      <button type="button" className="nes-btn is-error text-[10px] px-2 py-1" onClick={() => setDetectedMode(null)}>아니오</button>
                      <button type="button" className="nes-btn is-primary text-[10px] px-2 py-1" onClick={() => setConfirmedMode(detectedMode)}>예(변경)</button>
                  </div>
              </div>
          </div>
      )}

      {/* Bottom Controls */}
      <div className="nes-container is-rounded bg-white p-4 flex flex-col items-center">
         <div className="flex w-full items-center mb-4 border-b-2 border-black pb-2">
             <div className="mr-4 text-center flex items-center gap-2">
                 <img src={TransportIconFactory.getIconPath(confirmedMode)} className="w-6 h-6 pixelated drop-shadow-md" alt="mode" />
                 <span className="nes-text is-primary text-sm">{TransportIconFactory.getModeText(confirmedMode)}</span>
             </div>
             {/* Dev simulation buttons */}
             <div className="flex-1 flex justify-end gap-1 flex-wrap">
                <button className="nes-btn is-warning text-[8px] py-1 px-1" onClick={() => setDetectedMode('bus')}>[MOCK:버스]</button>
                <button className="nes-btn is-warning text-[8px] py-1 px-1" onClick={() => setDetectedMode('train')}>[MOCK:기차]</button>
             </div>
         </div>
         
         <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`w-full nes-btn ${isTracking ? 'is-error' : 'is-success'} shadow-[0_5px_0_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[5px]`}
         >
            {isTracking ? '■ 모험 종료' : '▶ 모험 시작'}
         </button>
      </div>
    </main>
  );
}
