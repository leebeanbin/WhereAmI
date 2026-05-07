'use client';

import { Map, Polyline, MapMarker } from 'react-kakao-maps-sdk';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { mapRegionToCityCode } from '@/application/utils/cityCodeMapper';
import { useNearbyStations } from '@/application/hooks/useNearbyStations';
import { useEffect, useState, useRef } from 'react';

export default function MapComponent() {
  const {
    currentLocation, route, confirmedMode,
    nearbyStations,
    selectedStation, setSelectedStation,
    cityCode, setCityCode
  } = useLocationStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const lastGeocodedLoc = useRef<{lat: number, lng: number} | null>(null);

  useNearbyStations();

  useEffect(() => {
    // Kakao Map 스크립트 로드 완료 후 렌더링을 보장하기 위한 딜레이 또는 체크
    // Next.js Script 태그의 onLoad 이벤트를 활용할 수도 있으나, 여기서는 sdk.js가 window.kakao 객체를 주입했는지 확인합니다.
    const checkKakao = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        setIsLoaded(true);
        clearInterval(checkKakao);
      }
    }, 100);
    return () => clearInterval(checkKakao);
  }, []);

  // Kakao Geocoder를 활용하여 위치 기반 cityCode 자동 갱신
  useEffect(() => {
    if (!currentLocation || !isLoaded || !window.kakao?.maps?.services) return;
    
    // 거리 차이 계산 (대략 0.1도가 약 10km)
    const distanceSq = lastGeocodedLoc.current 
      ? Math.pow(currentLocation.lat - lastGeocodedLoc.current.lat, 2) + Math.pow(currentLocation.lng - lastGeocodedLoc.current.lng, 2)
      : 1000;
      
    // 처음이거나 약 10km 이상 크게 이동했을 때만 Geocoding 호출 (API 트래픽 절약)
    if (distanceSq > 0.01) {
      lastGeocodedLoc.current = currentLocation;
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(currentLocation.lng, currentLocation.lat, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const region1 = result[0]?.region_1depth_name || '대전광역시';
          const newCityCode = mapRegionToCityCode(region1);
          setCityCode(newCityCode);
        }
      });
    }
  }, [currentLocation, isLoaded, setCityCode]);

  if (!currentLocation) return null;

  // 카카오 키가 없거나 스크립트 로딩 전이면 Placeholder 표시
  if (!isLoaded || !process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY) {
     return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100/50 rounded-xl border-4 border-black border-dashed p-4">
           <p className="text-gray-500 text-xs mb-2 text-center">지도 스크립트를 불러오는 중이거나<br/>API 키가 없습니다.</p>
           <p className="text-[10px] text-gray-400">({currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)})</p>
        </div>
     );
  }

  // 이동 경로 Polyline용 좌표 배열 세그먼트화 (수단별 색상 다르게)
  const segments: { mode: string | null, path: {lat: number, lng: number}[] }[] = [];
  let currentSegment: {lat: number, lng: number}[] = [];
  let currentMode = route.length > 0 ? route[0].confirmedMode : null;

  route.forEach((p) => {
    if (currentMode !== p.confirmedMode) {
      if (currentSegment.length > 0) {
        currentSegment.push({ lat: p.lat, lng: p.lng }); // 선이 끊어지지 않게 연결
        segments.push({ mode: currentMode, path: currentSegment });
      }
      currentSegment = [{ lat: p.lat, lng: p.lng }];
      currentMode = p.confirmedMode;
    } else {
      currentSegment.push({ lat: p.lat, lng: p.lng });
    }
  });
  if (currentSegment.length > 0) {
    segments.push({ mode: currentMode, path: currentSegment });
  }

  const getStrokeColor = (mode: string | null) => {
    if (mode === 'bus') return '#0000FF'; // Blue
    if (mode === 'train') return '#FF0000'; // Red
    return '#00FF00'; // Green for walk
  };
  
  const getStrokeStyle = (mode: string | null) => {
    if (mode === 'walk' || mode === null) return 'shortdash';
    return 'solid';
  };

  return (
    <Map
      center={currentLocation}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      level={3} // 확대 레벨 (작을수록 확대)
      className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
      onClick={() => setSelectedStation(null)} // 지도 빈 곳 클릭 시 전광판 닫기
    >
      {/* 주변 정류장 마커 렌더링 */}
      {nearbyStations.map((station) => (
          <MapMarker
             key={station.stationId}
             position={{ lat: station.lat, lng: station.lng }}
             image={{
                src: '/icons/bus_stop.svg',
                size: { width: 36, height: 36 },
                options: { offset: { x: 18, y: 36 } }
             }}
             title={station.stationName}
             onClick={() => setSelectedStation(station)}
          />
      ))}

      {/* 내 현재 위치 커스텀 마커 (팩토리에서 가져온 마인크래프트 아이콘) */}
      <MapMarker 
        position={currentLocation}
        image={{
            src: TransportIconFactory.getIconPath(confirmedMode),
            size: { width: 48, height: 48 }, // 픽셀 아이콘 크기
            options: { offset: { x: 24, y: 48 } } // 마커의 기준점을 이미지 하단 중앙으로
        }}
      />
      
      {/* 이동 경로 궤적 (수단별 색상 구분) */}
      {segments.map((seg, idx) => (
        seg.path.length > 1 && (
          <Polyline
            key={idx}
            path={[seg.path]}
            strokeWeight={6}
            strokeColor={getStrokeColor(seg.mode)}
            strokeOpacity={0.8}
            strokeStyle={getStrokeStyle(seg.mode) as any}
          />
        )
      ))}
    </Map>
  );
}
