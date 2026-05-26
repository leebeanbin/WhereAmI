'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { getDistanceFromLatLonInKm, formatDistance, formatDuration } from '@/application/utils/geoUtils';
import { playClickSound } from '@/application/utils/audioUtils';
import type { ApiBody } from '@/lib/apiResponse';
import type { PlaceInfoDto } from '@/app/api/place/route';
import type { PlaceDetailsDto } from '@/app/api/place/details/route';

const CATEGORY_ICON: Record<string, string> = {
  CE7: '/icons/banana.png',
  FD6: '/icons/banana.png',
  CS2: '/icons/controller_icon.png',
  AT4: '/icons/compass_icon.png',
  CT1: '/icons/book_icon.png',
  BK9: '/icons/book_icon.png',
  SC4: '/icons/book_icon.png',
  SW8: '/icons/subway_station.png',
  PO3: '/icons/book_icon.png',
  HP8: '/icons/compass_icon.png',
  PM9: '/icons/compass_icon.png',
};

const CATEGORY_COLOR: Record<string, string> = {
  CE7: '#b07d30', FD6: '#c0392b', CS2: '#2d6a4f',
  AT4: '#2563eb', CT1: '#6b21a8', BK9: '#374151',
  SW8: '#1d4ed8', HP8: '#dc2626', PM9: '#059669',
};

function categoryIcon(code: string | null) {
  return code ? (CATEGORY_ICON[code] ?? '/icons/compass_icon.png') : '/icons/compass_icon.png';
}
function categoryColor(code: string | null) {
  return code ? (CATEGORY_COLOR[code] ?? '#4b5563') : '#4b5563';
}
function renderStars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(0, 5 - full));
}
function dotFill(name: string, maxLen = 22): string {
  const dots = Math.max(2, maxLen - name.length);
  return '.'.repeat(dots);
}

type DetailTab = 'info' | 'hours' | 'reviews' | 'menu';

export default function MapPlaceSheet() {
  const { mapClickedLocation, setMapClickedLocation, setNavigationTarget, currentLocation } = useLocationStore();

  const [placeInfo, setPlaceInfo] = useState<PlaceInfoDto | null>(null);
  const [details, setDetails] = useState<PlaceDetailsDto | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('info');

  // 기본 정보 로드 — Geocoder(정확한 주소) → keywordSearch(해당 주소 POI)
  // 카테고리 반경 검색 제거: 인근 무관한 시설이 선택되는 오류의 근본 원인
  useEffect(() => {
    if (!mapClickedLocation) { setPlaceInfo(null); setDetails(null); return; }
    setLoadingInfo(true);
    setPlaceInfo(null);
    setDetails(null);
    setActiveTab('info');

    const { lat, lng } = mapClickedLocation;

    const kakaoSvc = (window as any).kakao?.maps?.services;
    if (kakaoSvc) {
      const geocoder = new kakaoSvc.Geocoder();
      const ps = new kakaoSvc.Places();
      const latlng = new (window as any).kakao.maps.LatLng(lat, lng);

      geocoder.coord2Address(lng, lat, (result: any[], status: any) => {
        let buildingName: string | null = null;
        let roadAddress: string | null = null;
        let jibunAddress: string | null = null;

        if (status === kakaoSvc.Status.OK && result[0]) {
          buildingName = result[0].road_address?.building_name || null;
          roadAddress = result[0].road_address?.address_name || null;
          jibunAddress = result[0].address?.address_name || null;
        }

        // 도로명주소 마지막 토큰에 숫자가 있으면 특정 건물 주소, 없으면 도로명 자체
        const lastToken = roadAddress?.trim().split(/\s+/).at(-1) ?? '';
        const isSpecificAddress = /^\d/.test(lastToken);

        // 검색 키워드: 건물이 특정되는 경우만 POI 검색
        // - 도로명주소(건물번호 있음): 그 주소의 POI → 옆 건물 시설은 검색 결과에 애초에 안 나옴
        // - 건물명: 이름으로 직접 탐색
        // - 도로명/공터: 검색 없이 주소만 표시
        const keyword = (isSpecificAddress ? roadAddress : null) ?? buildingName;

        if (!keyword) {
          setPlaceInfo({
            name: roadAddress || jibunAddress || '이 위치',
            address: jibunAddress || roadAddress || '주소 정보 없음',
            roadAddress,
            category: null, categoryCode: null, phone: null, placeUrl: null, placeId: null,
          });
          setLoadingInfo(false);
          return;
        }

        // 해당 주소/건물명으로 POI 검색 → 50m 이내 가장 가까운 것 선택
        ps.keywordSearch(
          keyword,
          (kwResult: any[], kwStatus: any) => {
            const best = kwStatus === kakaoSvc.Status.OK
              ? [...kwResult]
                  .filter((r: any) => Number(r.distance) <= 50)
                  .sort((a: any, b: any) => Number(a.distance) - Number(b.distance))[0] ?? null
              : null;

            setPlaceInfo({
              name: best?.place_name || buildingName || roadAddress || jibunAddress || '이 위치',
              address: jibunAddress || roadAddress || best?.address_name || '주소 정보 없음',
              roadAddress: roadAddress || best?.road_address_name || null,
              category: best
                ? (best.category_group_name || best.category_name?.split(' > ')[0] || null)
                : null,
              categoryCode: best?.category_group_code || null,
              phone: best?.phone || null,
              placeUrl: best?.place_url || null,
              placeId: best?.id || null,
            });
            setLoadingInfo(false);
          },
          { location: latlng, radius: 100, size: 15, sort: kakaoSvc.SortBy?.DISTANCE ?? 'DISTANCE' },
        );
      });
      return;
    }

    // SDK 미준비 시 서버 API 폴백
    fetch(`/api/place?lat=${lat}&lng=${lng}`)
      .then(r => r.json() as Promise<ApiBody<PlaceInfoDto>>)
      .then(body => { if (body.success) setPlaceInfo(body.data); })
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, [mapClickedLocation]);

  // placeId 확정되면 상세 정보 로드
  useEffect(() => {
    if (!placeInfo?.placeId) return;
    setLoadingDetails(true);
    fetch(`/api/place/details?placeId=${placeInfo.placeId}`)
      .then(r => r.json() as Promise<ApiBody<PlaceDetailsDto>>)
      .then(body => { if (body.success) setDetails(body.data); })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, [placeInfo?.placeId]);

  const handleClose = () => {
    playClickSound();
    setIsExiting(true);
    setTimeout(() => { setMapClickedLocation(null); setIsExiting(false); }, 280);
  };

  if (!mapClickedLocation) return null;

  const distKm = currentLocation
    ? getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, mapClickedLocation.lat, mapClickedLocation.lng)
    : null;
  const walkSec = distKm !== null ? (distKm / 4) * 3600 : null;

  const kakaoNavLink = placeInfo
    ? `https://map.kakao.com/link/to/${encodeURIComponent(placeInfo.name)},${mapClickedLocation.lat},${mapClickedLocation.lng}`
    : `https://map.kakao.com/link/map/${mapClickedLocation.lat},${mapClickedLocation.lng}`;

  const hasHours = (details?.openHours?.length ?? 0) > 0;
  const hasReviews = (details?.reviews?.length ?? 0) > 0;
  const hasMenu = (details?.menus?.length ?? 0) > 0;
  const hasDetails = placeInfo?.placeId && (hasHours || hasReviews || hasMenu || details?.rating || details?.homepage || (details?.tags?.length ?? 0) > 0);

  const tabs: { key: DetailTab; label: string; show: boolean }[] = [
    { key: 'info', label: '정보', show: true },
    { key: 'hours', label: '시간', show: hasHours },
    { key: 'reviews', label: '리뷰', show: hasReviews },
    { key: 'menu', label: '상점', show: hasMenu },
  ];

  return (
    <div className={`fixed z-[65] left-0 right-0 bottom-0 md:left-auto md:right-6 md:bottom-6 md:w-[420px] font-neodgm ${isExiting ? 'animate-slide-up-out' : 'animate-slide-up'}`}>
      <div className="bg-retro-cream border-2 border-black md:rounded-sm shadow-[4px_4px_0_rgba(0,0,0,1)] flex flex-col max-h-[80vh]">

        {/* 헤더 */}
        <div className="px-4 pt-4 pb-3 border-b-2 border-dashed border-gray-300 pr-12 relative shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-black bg-white hover:bg-gray-100 w-8 h-8 flex items-center justify-center rounded-sm border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px]"
          >
            <span className="text-retro-body-bold leading-none select-none">X</span>
          </button>

          {loadingInfo ? (
            <div className="flex items-center gap-2 py-2 animate-pulse">
              <img src="/icons/compass_icon.png" className="w-5 h-5 pixelated shrink-0 animate-spin" alt="loading" />
              <span className="text-retro-caption text-retro-gray">위치 정보 수신 중...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {placeInfo?.category && (
                  <div className="flex items-center gap-1">
                    <img src={categoryIcon(placeInfo.categoryCode)} className="w-3.5 h-3.5 pixelated shrink-0" alt="" />
                    <span className="text-retro-tiny font-bold uppercase tracking-wider px-1.5 py-0.5 border-2 border-black"
                      style={{ background: categoryColor(placeInfo.categoryCode), color: '#fff', boxShadow: '1px 1px 0 #000' }}>
                      {placeInfo.category}
                    </span>
                  </div>
                )}
                {/* 영업 상태 배지 — details 로드 완료 후 표시 */}
                {!loadingDetails && details?.isOpen !== null && details?.isOpen !== undefined && (
                  <span className={`text-retro-tiny font-bold px-1.5 py-0.5 border-2 border-black flex items-center gap-1 ${details.isOpen ? 'bg-green-100 text-green-800 border-green-600' : 'bg-red-100 text-red-800 border-red-600'}`}
                    style={{ boxShadow: '1px 1px 0 #000' }}>
                    <span className={`inline-block w-2 h-2 rounded-full ${details.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    {details.isOpen ? '영업 중' : '영업 종료'}
                  </span>
                )}
                {/* 별점 */}
                {details?.rating && (
                  <span className="text-retro-tiny text-yellow-600 font-bold">
                    {renderStars(details.rating)} {details.rating.toFixed(1)}
                    {details.reviewCount ? ` (${details.reviewCount})` : ''}
                  </span>
                )}
              </div>
              <div className="text-retro-subtitle text-retro-wood font-bold leading-tight mb-1">
                {placeInfo?.name ?? '선택한 위치'}
              </div>
              {placeInfo?.roadAddress && (
                <div className="text-retro-caption text-retro-green/80 truncate">{placeInfo.roadAddress}</div>
              )}
              {placeInfo?.address && placeInfo.address !== placeInfo.roadAddress && (
                <div className="text-retro-tiny text-retro-gray truncate mt-0.5">{placeInfo.address}</div>
              )}
              {details?.openDesc && (
                <div className="text-retro-tiny text-retro-gray mt-1 italic">{details.openDesc}</div>
              )}
            </>
          )}
        </div>

        {/* 탭 — 상세 데이터 있을 때만 표시 */}
        {!loadingInfo && (hasDetails || loadingDetails) && (
          <div className="flex border-b-2 border-black shrink-0 select-none">
            {tabs.filter(t => t.show).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => { playClickSound(); setActiveTab(t.key); }}
                className={`flex-1 text-retro-tiny font-bold py-1.5 border-r-2 border-black last:border-r-0 transition-colors ${activeTab === t.key ? 'bg-retro-green text-white' : 'bg-retro-cream text-retro-gray hover:bg-gray-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* 탭 콘텐츠 — 스크롤 가능 */}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>

          {/* 정보 탭 */}
          {activeTab === 'info' && !loadingInfo && (
            <div className="px-4 py-3 flex flex-col gap-2">
              {distKm !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="dist" />
                    <span className="text-retro-caption-bold text-retro-green">{formatDistance(distKm)}</span>
                  </div>
                  {walkSec !== null && (
                    <div className="flex items-center gap-1.5">
                      <img src="/icons/walk_man.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="walk" />
                      <span className="text-retro-caption text-retro-gray">도보 {formatDuration(walkSec)}</span>
                    </div>
                  )}
                </div>
              )}
              {details?.openDesc && (
                <div className="flex items-center gap-1.5">
                  <span className="text-retro-tiny text-retro-gray italic">{details.openDesc}</span>
                </div>
              )}
              {placeInfo?.phone && (
                <div className="flex items-center gap-1.5">
                  <img src="/icons/controller_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="phone" />
                  <a href={`tel:${placeInfo.phone}`} onClick={() => playClickSound()}
                    className="text-retro-caption text-retro-green/80 hover:text-retro-green transition-colors">
                    {placeInfo.phone}
                  </a>
                </div>
              )}
              {details?.homepage && (
                <div className="flex items-center gap-1.5">
                  <img src="/icons/book_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="web" />
                  <a href={details.homepage} target="_blank" rel="noopener noreferrer"
                    onClick={() => playClickSound()}
                    className="text-retro-caption text-retro-green/80 hover:text-retro-green transition-colors truncate max-w-[220px]">
                    {details.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              )}
              {(details?.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {details!.tags.map((tag, i) => (
                    <span key={i} className="text-retro-tiny px-1.5 py-0.5 border border-black/30 bg-retro-moss text-retro-dark">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <img src="/icons/tree_hud.png" className="w-3.5 h-3.5 pixelated shrink-0 animate-gps-blink" alt="gps" />
                <span className="text-retro-tiny text-retro-gray font-mono">
                  {mapClickedLocation.lat.toFixed(5)}, {mapClickedLocation.lng.toFixed(5)}
                </span>
              </div>
              {loadingDetails && (
                <div className="flex items-center gap-1.5 pt-1 animate-pulse">
                  <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated shrink-0 animate-spin" alt="loading" />
                  <span className="text-retro-tiny text-retro-gray">상세 정보 수신 중...</span>
                </div>
              )}
            </div>
          )}

          {/* 영업시간 탭 */}
          {activeTab === 'hours' && (
            <div className="px-4 py-3">
              <div className="text-retro-caption-bold text-retro-wood mb-2 uppercase tracking-wider">[ 영업 시간표 ]</div>
              <div className="flex flex-col gap-1">
                {details?.openHours.map((h, i) => (
                  <div key={i} className="flex justify-between items-center bg-retro-moss px-2 py-1 border border-black/20 text-retro-dark">
                    <span className="text-retro-caption-bold text-retro-wood shrink-0">{h.label}</span>
                    <span className="text-retro-caption text-retro-gray">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 리뷰 탭 */}
          {activeTab === 'reviews' && (
            <div className="px-4 py-3">
              <div className="text-retro-caption-bold text-retro-wood mb-2 uppercase tracking-wider">[ 모험가 한줄평 ]</div>
              <div className="flex flex-col gap-2">
                {details?.reviews.map((r, i) => (
                  <div key={i} className="bg-retro-moss border border-black/20 px-3 py-2 animate-pixel-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-retro-tiny font-bold text-retro-wood">{r.author}</span>
                      {r.rating > 0 && (
                        <span className="text-retro-tiny text-yellow-600">{renderStars(r.rating)}</span>
                      )}
                    </div>
                    <p className="text-retro-caption text-retro-dark leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메뉴(상점) 탭 */}
          {activeTab === 'menu' && (
            <div className="px-4 py-3">
              <div className="text-retro-caption-bold text-retro-wood mb-2 uppercase tracking-wider">[ 아이템 상점 ]</div>
              <div className="border-2 border-black bg-retro-moss p-2 shadow-[2px_2px_0_#000]">
                {details?.menus.map((m, i) => (
                  <div key={i} className="flex items-baseline gap-1 py-0.5 border-b border-dashed border-black/20 last:border-0 animate-pixel-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <span className="text-retro-caption text-retro-dark shrink-0">{m.name}</span>
                    <span className="flex-1 text-retro-tiny text-retro-gray overflow-hidden" style={{ letterSpacing: '-0.5px' }}>
                      {dotFill(m.name)}
                    </span>
                    <span className="text-retro-caption-bold text-retro-wood shrink-0 whitespace-nowrap">
                      {m.price ? `${m.price} G` : '?? G'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-retro-tiny text-retro-gray text-right mt-1">💰 Gold 단위 표기</div>
            </div>
          )}
        </div>

        {/* 액션 버튼 — 항상 하단 고정 */}
        <div className="px-4 py-3 flex gap-2 select-none border-t-2 border-dashed border-gray-300 shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setNavigationTarget({
                lat: mapClickedLocation.lat,
                lng: mapClickedLocation.lng,
                name: placeInfo?.name ?? '선택한 위치',
                kakaoLink: kakaoNavLink,
              });
              setMapClickedLocation(null);
            }}
            className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-caption-bold py-1.5 flex-1 flex items-center justify-center gap-1.5"
          >
            <img src="/icons/walk_man.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="navigate" />
            <span>길찾기</span>
          </button>
          {placeInfo?.placeUrl && (
            <a href={placeInfo.placeUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => playClickSound()}
              className="pixel-btn-3d pixel-btn-3d-sm is-success text-retro-caption-bold py-1.5 px-2.5 flex items-center justify-center gap-1"
              style={{ textDecoration: 'none' }}>
              <img src="/icons/book_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="place" />
              <span>플레이스</span>
            </a>
          )}
          <a href={kakaoNavLink} target="_blank" rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className="pixel-btn-3d pixel-btn-3d-sm is-warning text-retro-caption-bold py-1.5 px-2.5 flex items-center justify-center gap-1"
            style={{ textDecoration: 'none' }}>
            <img src="/icons/compass_icon.png" className="w-3.5 h-3.5 pixelated shrink-0" alt="kakao" />
            <span>카카오맵</span>
          </a>
          <a
            href={`https://map.kakao.com/link/roadview/${mapClickedLocation.lat},${mapClickedLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClickSound()}
            className="pixel-btn-3d pixel-btn-3d-sm is-cream text-retro-caption-bold py-1.5 px-2.5 flex items-center justify-center gap-1"
            style={{ textDecoration: 'none' }}
            title="거리뷰"
          >
            <span>👁</span>
          </a>
        </div>
      </div>
    </div>
  );
}
