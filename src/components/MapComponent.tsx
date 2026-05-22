'use client';

import { Map, Polyline, MapMarker } from 'react-kakao-maps-sdk';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { useNearbyStations } from '@/application/hooks/useNearbyStations';
import { useCityCode } from '@/application/hooks/useCityCode';
import { MAP_ZOOM_LEVEL, STATION_MARKER_SIZE, PLAYER_MARKER_SIZE, ROUTE_COLORS, ROUTE_STROKE_WEIGHT, ROUTE_STROKE_OPACITY } from '@/constants/map';
import { useEffect, useState } from 'react';

export default function MapComponent() {
  const {
    currentLocation, route, confirmedMode,
    nearbyStations,
    selectedStation, setSelectedStation,
  } = useLocationStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useNearbyStations();
  useCityCode();

  useEffect(() => {
    const checkKakao = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        setIsLoaded(true);
        clearInterval(checkKakao);
      }
    }, 100);
    return () => clearInterval(checkKakao);
  }, []);

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
    if (mode === 'bus') return ROUTE_COLORS.bus;
    if (mode === 'train') return ROUTE_COLORS.train;
    return ROUTE_COLORS.walk;
  };

  const getStrokeStyle = (mode: string | null) =>
    mode === 'walk' || mode === null ? 'shortdash' : 'solid';

  return (
    <Map
      center={currentLocation}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
      level={MAP_ZOOM_LEVEL}
      className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] retro-map-filter"
      onClick={() => setSelectedStation(null)}
    >
      {nearbyStations.map((station) => (
        <MapMarker
          key={station.stationId}
          position={{ lat: station.lat, lng: station.lng }}
          image={{
            src: TransportIconFactory.getStationMarkerPath(station.type),
            size: { width: STATION_MARKER_SIZE, height: STATION_MARKER_SIZE },
            options: { offset: { x: STATION_MARKER_SIZE / 2, y: STATION_MARKER_SIZE } },
          }}
          title={station.stationName}
          onClick={() => setSelectedStation(station)}
        />
      ))}

      <MapMarker
        position={currentLocation}
        image={{
          src: TransportIconFactory.getIconPath(confirmedMode),
          size: { width: PLAYER_MARKER_SIZE, height: PLAYER_MARKER_SIZE },
          options: { offset: { x: PLAYER_MARKER_SIZE / 2, y: PLAYER_MARKER_SIZE } },
        }}
      />

      {segments.map((seg, idx) =>
        seg.path.length > 1 && (
          <Polyline
            key={idx}
            path={[seg.path]}
            strokeWeight={ROUTE_STROKE_WEIGHT}
            strokeColor={getStrokeColor(seg.mode)}
            strokeOpacity={ROUTE_STROKE_OPACITY}
            strokeStyle={getStrokeStyle(seg.mode) as any}
          />
        )
      )}
    </Map>
  );
}
