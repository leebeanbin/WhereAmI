'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import { playClickSound } from '@/application/utils/audioUtils';
import { getDistanceFromLatLonInKm, formatDistance } from '@/application/utils/geoUtils';

interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  category: string;
  categoryCode: string;
  phone: string;
  placeUrl: string;
  lat: number;
  lng: number;
  distance: number;
}

type CategoryTab = 'FD6' | 'CE7' | 'AT4' | 'CS2';

const CATEGORY_LABELS: Record<CategoryTab, string> = {
  FD6: '🍜 식당',
  CE7: '☕ 카페',
  AT4: '🏛 명소',
  CS2: '🏪 편의점',
};

interface Props {
  onClose: () => void;
}

export default function NearbyRecommendSheet({ onClose }: Props) {
  const { currentLocation, setNavigationTarget } = useLocationStore();
  const [activeTab, setActiveTab] = useState<CategoryTab>('FD6');
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback((tab: CategoryTab) => {
    if (!currentLocation) return;
    const kakaoSvc = (window as any).kakao?.maps?.services;
    if (!kakaoSvc) return;

    setLoading(true);
    setPlaces([]);

    const ps = new kakaoSvc.Places();
    const latlng = new (window as any).kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);

    ps.categorySearch(
      tab,
      (result: any[], status: any) => {
        setLoading(false);
        if (status !== kakaoSvc.Status.OK) return;
        const mapped: NearbyPlace[] = result.slice(0, 10).map((r: any) => ({
          id: r.id,
          name: r.place_name,
          address: r.road_address_name || r.address_name || '',
          category: r.category_name?.split(' > ').slice(-1)[0] ?? '',
          categoryCode: r.category_group_code ?? tab,
          phone: r.phone ?? '',
          placeUrl: r.place_url ?? '',
          lat: parseFloat(r.y),
          lng: parseFloat(r.x),
          distance: getDistanceFromLatLonInKm(currentLocation.lat, currentLocation.lng, parseFloat(r.y), parseFloat(r.x)) * 1000,
        }));
        setPlaces(mapped);
      },
      { location: latlng, radius: 300, size: 10, sort: kakaoSvc.SortBy?.DISTANCE ?? 'DISTANCE' },
    );
  }, [currentLocation]);

  useEffect(() => {
    search(activeTab);
  }, [activeTab, search]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-retro-cream border-t-4 border-black rounded-t-sm flex flex-col"
        style={{ maxHeight: '70%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-black shrink-0">
          <span className="text-retro-body-bold text-retro-wood">주변 탐색</span>
          <button
            type="button"
            onClick={() => { playClickSound(); onClose(); }}
            className="pixel-btn-3d pixel-btn-3d-sm is-error w-7 h-7 !p-0 flex items-center justify-center text-xs"
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-3 py-2 shrink-0 border-b border-dashed border-gray-300">
          {(Object.keys(CATEGORY_LABELS) as CategoryTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { playClickSound(); setActiveTab(tab); }}
              className={`pixel-btn-3d pixel-btn-3d-sm text-retro-tiny py-1 px-2 flex-1 ${activeTab === tab ? 'is-primary' : 'is-cream'}`}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2">
              <img src="/icons/compass_icon.png" className="w-6 h-6 pixelated animate-spin" style={{ animationDuration: '2s' }} alt="loading" />
              <span className="text-retro-caption text-retro-gray">탐색 중...</span>
            </div>
          )}
          {!loading && places.length === 0 && (
            <p className="text-retro-caption text-retro-gray text-center py-8">300m 이내 결과 없음</p>
          )}
          {places.map((place) => (
            <div
              key={place.id}
              className="flex items-start gap-3 py-2.5 border-b border-dashed border-gray-200 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-retro-body-bold text-retro-dark truncate">{place.name}</p>
                <p className="text-retro-tiny text-retro-gray truncate">{place.address}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-retro-tiny text-retro-green font-bold">{formatDistance(place.distance / 1000)}</span>
                  {place.category && <span className="text-retro-tiny text-retro-gray">{place.category}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setNavigationTarget({
                    lat: place.lat,
                    lng: place.lng,
                    name: place.name,
                    kakaoLink: `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`,
                  });
                  onClose();
                }}
                className="pixel-btn-3d pixel-btn-3d-sm is-primary text-retro-tiny py-1 px-2 shrink-0 flex items-center gap-1"
              >
                <img src="/icons/walk_man.png" className="w-3 h-3 pixelated" alt="go" />
                <span>길찾기</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
