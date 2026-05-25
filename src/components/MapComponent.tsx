'use client';

import { Map, Polyline, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { useLocationStore } from '@/store/useLocationStore';
import { TransportIconFactory } from '@/application/factories/TransportIconFactory';
import { useNearbyStations } from '@/application/hooks/useNearbyStations';
import { useNavigationRoute } from '@/application/hooks/useNavigationRoute';
import { useCityCode } from '@/application/hooks/useCityCode';
import { MAP_ZOOM_LEVEL, ROUTE_COLORS, ROUTE_STROKE_WEIGHT, ROUTE_STROKE_OPACITY } from '@/constants/map';
import { playClickSound } from '@/application/utils/audioUtils';
import { useEffect, useState } from 'react';

export default function MapComponent() {
  const {
    currentLocation, route, confirmedMode,
    nearbyStations,
    setSelectedStation,
    navigationTarget, navigationRoute, navMode,
    setMapClickedLocation,
  } = useLocationStore();

  const getStationOffsetY = (type: 'bus' | 'subway' | 'train') => {
    if (type === 'subway') return 59;
    if (type === 'train') return 57;
    return 56; // bus
  };
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(MAP_ZOOM_LEVEL);

  useNearbyStations(zoomLevel);
  useNavigationRoute();
  useCityCode();

  useEffect(() => {
    const checkKakao = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        clearInterval(checkKakao);
        // autoload=false이므로 반드시 load() 후 SDK 사용
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      }
    }, 100);
    return () => clearInterval(checkKakao);
  }, []);

  // 카카오 키가 없거나 스크립트 로딩 전이면 Placeholder 표시
  if (!isLoaded || !process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY) {
     return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-retro-cream border-retro-thick p-6 animate-pixel-in">
          <img src="/icons/compass_icon.png" className="w-14 h-14 pixelated mb-3 animate-spin" style={{ animationDuration: '4s' }} alt="map loading" />
          <p className="text-retro-body-bold text-retro-wood mb-1">지도 신호 탐색 중...</p>
          <p className="text-retro-caption text-retro-green/70 text-center leading-relaxed mb-4">
            Kakao Map API 키가 필요합니다.<br />
            <span className="text-retro-tiny">developers.kakao.com에서 발급 후<br />.env.local에 추가하세요.</span>
          </p>
          <div className="flex items-center gap-1.5 border-t-2 border-dashed border-gray-300 pt-2">
            <img src="/icons/tree_hud.png" className="w-3.5 h-3.5 pixelated shrink-0 animate-gps-blink" alt="gps" />
            <span className="text-retro-tiny text-retro-gray font-mono">
              {currentLocation
                ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : '신호 탐색 대기 중...'}
            </span>
          </div>
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

  const getStrokeStyle = (mode: string | null) => {
    if (mode === 'walk' || mode === null) return 'dotted';  // 도보: 점선 (카카오맵 표준 속성)
    if (mode === 'bus') return 'solid';
    return 'dashed';  // 기차: 대시선 (카카오맵 표준 속성)
  };

  const defaultCenter = { lat: 37.5665, lng: 126.9780 }; // 서울역
  const mapCenter = currentLocation || defaultCenter;

  return (
    <div className="absolute inset-0">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        level={zoomLevel}
        onZoomChanged={(map) => setZoomLevel(map.getLevel())}
        className="retro-map-filter"
        onClick={(_, mouseEvent) => {
          setSelectedStation(null);
          setMapClickedLocation({
            lat: mouseEvent.latLng.getLat(),
            lng: mouseEvent.latLng.getLng(),
          });
        }}
      >
        {nearbyStations.map((station) => (
          <MapMarker
            key={station.stationId}
            position={{ lat: station.lat, lng: station.lng }}
            image={{
              src: TransportIconFactory.getStationMarkerPath(station.type),
              size: { width: 64, height: 64 },
              options: { offset: { x: 32, y: getStationOffsetY(station.type) } }
            }}
            title={station.stationName}
            onClick={() => {
              setSelectedStation(station);
            }}
          />
        ))}

        {currentLocation && (
          <MapMarker
            position={currentLocation}
            image={{
              src: TransportIconFactory.getIconPath(confirmedMode),
              size: { width: 80, height: 80 },
              options: { offset: { x: 40, y: 80 } }
            }}
            title="YOU"
          />
        )}

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

        {navigationTarget && navigationRoute && navigationRoute.length > 1 && (
          <Polyline
            path={[navigationRoute]}
            strokeWeight={5}
            strokeColor={navMode === 'car' ? '#d97706' : '#cc2222'}
            strokeOpacity={0.9}
            strokeStyle="solid"
          />
        )}
        {navigationTarget && !navigationRoute && navMode !== 'transit' && currentLocation && (
          <Polyline
            path={[[currentLocation, { lat: navigationTarget.lat, lng: navigationTarget.lng }]]}
            strokeWeight={3}
            strokeColor={navMode === 'car' ? '#d97706' : '#cc2222'}
            strokeOpacity={0.5}
            strokeStyle="shortdash"
          />
        )}

        {navigationTarget && (
          <CustomOverlayMap
            position={{ lat: navigationTarget.lat, lng: navigationTarget.lng }}
            yAnchor={1.4}
          >
            <div style={{
              background: '#cc2222',
              border: '3px solid #000000',
              padding: '4px 8px',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
              boxShadow: '3px 3px 0 #000000',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              borderRadius: '2px',
            }}>
              ★ {navigationTarget.name}
            </div>
          </CustomOverlayMap>
        )}
      </Map>

      {/* 8-Bit Custom Zoom Controller */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 select-none pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            setZoomLevel(prev => Math.max(1, prev - 1));
          }}
          className="pixel-btn-3d pixel-btn-3d-sm is-primary w-10 h-10 !p-0 flex items-center justify-center text-xl font-bold text-white"
          title="확대"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            setZoomLevel(prev => Math.min(14, prev + 1));
          }}
          className="pixel-btn-3d pixel-btn-3d-sm is-primary w-10 h-10 !p-0 flex items-center justify-center text-xl font-bold text-white"
          title="축소"
        >
          -
        </button>
      </div>
    </div>
  );
}
