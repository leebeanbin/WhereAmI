'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getDistanceFromLatLonInKm, formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { playClickSound } from '@/application/utils/audioUtils';
import type { ApiBody } from '@/lib/apiResponse';
import type { PlaceInfoDto } from '@/app/api/place/route';

export default function MapPlaceSheet() {
  const {
    mapClickedLocation,
    setMapClickedLocation,
    setNavigationTarget,
    currentLocation,
  } = useLocationStore();

  const [placeInfo, setPlaceInfo] = useState<PlaceInfoDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!mapClickedLocation) {
      setPlaceInfo(null);
      return;
    }
    setLoading(true);
    setPlaceInfo(null);
    fetch(`/api/place?lat=${mapClickedLocation.lat}&lng=${mapClickedLocation.lng}`)
      .then(r => r.json() as Promise<ApiBody<PlaceInfoDto>>)
      .then(body => { if (body.success) setPlaceInfo(body.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mapClickedLocation]);

  const handleClose = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => {
      setMapClickedLocation(null);
      setIsExiting(false);
    }, 280);
  };

  if (!mapClickedLocation) return null;

  const distKm = currentLocation
    ? getDistanceFromLatLonInKm(
        currentLocation.lat, currentLocation.lng,
        mapClickedLocation.lat, mapClickedLocation.lng,
      )
    : null;
  const walkSec = distKm !== null ? (distKm / 4) * 3600 : null;

  const kakaoLink = placeInfo
    ? `https://map.kakao.com/link/to/${encodeURIComponent(placeInfo.name)},${mapClickedLocation.lat},${mapClickedLocation.lng}`
    : `https://map.kakao.com/link/map/${mapClickedLocation.lat},${mapClickedLocation.lng}`;

  return (
    <div
      className={`fixed z-[65] left-0 right-0 bottom-0 md:left-auto md:right-6 md:bottom-6 md:w-[400px] font-neodgm ${isExiting ? 'animate-slide-up-out' : 'animate-slide-up'}`}
    >
      <div className="bg-retro-cream border-2 border-black md:rounded-sm p-4 shadow-[4px_4px_0_rgba(0,0,0,1)]">
        {/* 닫기 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-black bg-white hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-sm border-retro-thin shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
        >
          <span className="text-retro-body-bold leading-none select-none">X</span>
        </button>

        {/* 위치 정보 */}
        <div className="flex items-start justify-between gap-2 pr-8 mb-3">
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center gap-2 animate-pulse">
                <img src="/icons/compass_icon.png" className="w-4 h-4 pixelated shrink-0 animate-spin" alt="loading" />
                <span className="text-retro-caption text-retro-gray">위치 정보 수신 중...</span>
              </div>
            ) : (
              <>
                <div className="text-retro-subtitle text-retro-wood font-bold truncate">
                  {placeInfo?.name ?? '선택한 위치'}
                </div>
                {placeInfo?.roadAddress && (
                  <div className="text-retro-caption text-retro-green/80 mt-0.5 truncate">
                    {placeInfo.roadAddress}
                  </div>
                )}
                <div className="text-retro-tiny text-retro-gray mt-0.5 truncate">
                  {placeInfo?.address ?? `${mapClickedLocation.lat.toFixed(5)}, ${mapClickedLocation.lng.toFixed(5)}`}
                </div>
              </>
            )}
          </div>

          {distKm !== null && (
            <div className="text-right shrink-0">
              <div className="text-retro-caption-bold text-retro-green">{formatDistance(distKm)}</div>
              {walkSec !== null && (
                <div className="text-retro-tiny text-retro-gray">도보 {formatDuration(walkSec)}</div>
              )}
            </div>
          )}
        </div>

        {/* 좌표 */}
        <div className="flex items-center gap-1.5 mb-3 text-retro-tiny text-retro-gray font-mono border-t border-dashed border-gray-300 pt-2">
          <img src="/icons/tree_hud.png" className="w-3 h-3 pixelated shrink-0" alt="pin" />
          <span>{mapClickedLocation.lat.toFixed(5)}, {mapClickedLocation.lng.toFixed(5)}</span>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 select-none">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setNavigationTarget({
                lat: mapClickedLocation.lat,
                lng: mapClickedLocation.lng,
                name: placeInfo?.name ?? '선택한 위치',
                kakaoLink,
              });
              setMapClickedLocation(null);
            }}
            className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-caption-bold py-1.5 flex-1 flex items-center justify-center gap-1.5"
          >
            <img src="/icons/walk_man.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="navigate" />
            <span>이 위치로 길찾기</span>
          </button>
          <a
            href={kakaoLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1.5 px-2.5 flex items-center justify-center gap-1"
            style={{ textDecoration: 'none' }}
          >
            <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="kakao" />
            <span>카카오맵</span>
          </a>
        </div>
      </div>
    </div>
  );
}
