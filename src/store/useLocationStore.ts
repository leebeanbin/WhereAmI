import { create } from 'zustand';
import { RoutePoint, TransportMode } from '../domain/models/Journey';
import { StationInfo } from '../domain/interfaces/IPublicTransportAdapter';
import { DEFAULT_CITY_CODE } from '../constants/api';

export type { RoutePoint, TransportMode };

export interface NavigationTarget {
  lat: number;
  lng: number;
  name: string;
  kakaoLink: string;
}

interface LocationState {
  currentLocation: { lat: number; lng: number } | null;
  route: RoutePoint[];
  isTracking: boolean;
  detectedMode: TransportMode;
  confirmedMode: TransportMode;
  emaSpeed: number;
  nearbyStations: StationInfo[];
  selectedStation: StationInfo | null;
  navigationTarget: NavigationTarget | null;
  navigationRoute: { lat: number; lng: number }[] | null;
  navMode: 'walk' | 'car' | 'transit';
  mapClickedLocation: { lat: number; lng: number } | null;
  showTicketModal: boolean;
  cityCode: string;
  tourismNews: { title: string; distance: number } | null;
  toast: { message: string; type: 'error' | 'success' } | null;
  soundEnabled: boolean;
  scanlineEnabled: boolean;
  gpsPermissionStatus: 'granted' | 'prompt' | 'denied' | 'unknown';
  currentRegion: string | null;
  setCurrentLocation: (loc: { lat: number; lng: number }) => void;
  setCurrentRegion: (region: string | null) => void;
  addRoutePoint: (point: RoutePoint) => void;
  toggleTracking: () => void;
  setDetectedMode: (mode: TransportMode) => void;
  setConfirmedMode: (mode: TransportMode) => void;
  setNearbyStations: (stations: StationInfo[]) => void;
  setSelectedStation: (station: StationInfo | null) => void;
  setNavigationTarget: (target: NavigationTarget | null) => void;
  setNavigationRoute: (route: { lat: number; lng: number }[] | null) => void;
  setNavMode: (mode: 'walk' | 'car' | 'transit') => void;
  setMapClickedLocation: (loc: { lat: number; lng: number } | null) => void;
  setShowTicketModal: (show: boolean) => void;
  setCityCode: (code: string) => void;
  setTourismNews: (news: { title: string; distance: number } | null) => void;
  setToast: (toast: { message: string; type: 'error' | 'success' } | null) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setScanlineEnabled: (enabled: boolean) => void;
  setGpsPermissionStatus: (status: 'granted' | 'prompt' | 'denied' | 'unknown') => void;
  checkInStation: (stationId: string, stationName: string) => void;
  loadPersistedJourney: () => void;
  clearActiveJourneyCache: () => void;
}

const saveToLocalStorage = (route: RoutePoint[], isTracking: boolean, confirmedMode: TransportMode) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('whereami_active_journey', JSON.stringify({ route, isTracking, confirmedMode }));
    } catch (e) {
      console.error('[LocationStore] Failed to save active journey to localStorage', e);
    }
  }
};

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  route: [],
  isTracking: false,
  detectedMode: null,
  confirmedMode: 'walk',
  emaSpeed: 0,
  nearbyStations: [],
  selectedStation: null,
  navigationTarget: null,
  navigationRoute: null,
  navMode: 'walk',
  mapClickedLocation: null,
  showTicketModal: false,
  cityCode: DEFAULT_CITY_CODE,
  tourismNews: null,
  toast: null,
  soundEnabled: true, // Default to true
  scanlineEnabled: true, // Default to true
  gpsPermissionStatus: 'unknown',
  currentRegion: null,
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setCurrentRegion: (region) => set({ currentRegion: region }),
  addRoutePoint: (point) => set((state) => {
      const newRoute = [...state.route, point];
      saveToLocalStorage(newRoute, state.isTracking, state.confirmedMode);
      return { 
          route: newRoute,
          emaSpeed: point.emaSpeedKmh
      };
  }),
  toggleTracking: () => set((state) => {
      const newIsTracking = !state.isTracking;
      const newRoute = newIsTracking ? [] : state.route;

      if (!newIsTracking) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('whereami_active_journey');
        }
      } else {
        saveToLocalStorage(newRoute, newIsTracking, state.confirmedMode);
      }

      return {
          isTracking: newIsTracking,
          route: newRoute,
      };
  }),
  setDetectedMode: (mode) => set({ detectedMode: mode }),
  setConfirmedMode: (mode) => set((state) => {
      saveToLocalStorage(state.route, state.isTracking, mode);
      return { confirmedMode: mode, detectedMode: null };
  }),
  setNearbyStations: (stations) => set({ nearbyStations: stations }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setNavigationTarget: (target) => set({ navigationTarget: target, navigationRoute: null }),
  setNavigationRoute: (route) => set({ navigationRoute: route }),
  setNavMode: (mode) => set({ navMode: mode, navigationRoute: null }),
  setMapClickedLocation: (loc) => set({ mapClickedLocation: loc }),
  setShowTicketModal: (show) => set({ showTicketModal: show }),
  setCityCode: (code) => set({ cityCode: code }),
  setTourismNews: (news) => set({ tourismNews: news }),
  setToast: (toast) => set({ toast }),
  setSoundEnabled: (enabled) => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whereami_sound_enabled', String(enabled));
    }
    return { soundEnabled: enabled };
  }),
  setScanlineEnabled: (enabled) => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whereami_scanline_enabled', String(enabled));
    }
    return { scanlineEnabled: enabled };
  }),
  setGpsPermissionStatus: (status) => set({ gpsPermissionStatus: status }),
  checkInStation: (stationId, stationName) => set((state) => {
    if (state.route.length === 0) return {};
    const newRoute = [...state.route];
    const idx = newRoute.length - 1;
    newRoute[idx] = {
      ...newRoute[idx],
      stickerId: stationId,
      visitedStationName: stationName,
    };
    saveToLocalStorage(newRoute, state.isTracking, state.confirmedMode);
    return { route: newRoute };
  }),
  loadPersistedJourney: () => {
    if (typeof window !== 'undefined') {
      try {
        const dataStr = localStorage.getItem('whereami_active_journey');
        if (dataStr) {
          const { route, isTracking, confirmedMode } = JSON.parse(dataStr);
          const emaSpeed = route.length > 0 ? route[route.length - 1].emaSpeedKmh : 0;
          set({ route, isTracking, confirmedMode, emaSpeed });
        }

        const soundPersisted = localStorage.getItem('whereami_sound_enabled');
        if (soundPersisted !== null) {
          set({ soundEnabled: soundPersisted === 'true' });
        }

        const scanlinePersisted = localStorage.getItem('whereami_scanline_enabled');
        if (scanlinePersisted !== null) {
          set({ scanlineEnabled: scanlinePersisted === 'true' });
        }
      } catch (e) {
        console.error('[LocationStore] Failed to load active journey from localStorage', e);
      }
    }
  },
  clearActiveJourneyCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('whereami_active_journey');
    }
    set({ route: [], isTracking: false, emaSpeed: 0 });
  }
}));

