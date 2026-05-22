import { create } from 'zustand';
import { RoutePoint, TransportMode } from '../domain/models/Journey';
import { StationInfo } from '../domain/interfaces/IPublicTransportAdapter';
import { DEFAULT_CITY_CODE } from '../constants/api';

export type { RoutePoint, TransportMode };

interface LocationState {
  currentLocation: { lat: number; lng: number } | null;
  route: RoutePoint[];
  isTracking: boolean;
  detectedMode: TransportMode;
  confirmedMode: TransportMode;
  emaSpeed: number; // Current Exponential Moving Average speed
  nearbyStations: StationInfo[];
  selectedStation: StationInfo | null;
  showTicketModal: boolean;
  cityCode: string;
  tourismNews: { title: string; distance: number } | null;
  toast: { message: string; type: 'error' | 'success' } | null;
  setCurrentLocation: (loc: { lat: number; lng: number }) => void;
  addRoutePoint: (point: RoutePoint) => void;
  toggleTracking: () => void;
  setDetectedMode: (mode: TransportMode) => void;
  setConfirmedMode: (mode: TransportMode) => void;
  setNearbyStations: (stations: StationInfo[]) => void;
  setSelectedStation: (station: StationInfo | null) => void;
  setShowTicketModal: (show: boolean) => void;
  setCityCode: (code: string) => void;
  setTourismNews: (news: { title: string; distance: number } | null) => void;
  setToast: (toast: { message: string; type: 'error' | 'success' } | null) => void;
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
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
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
      const newNearbyStations = newIsTracking ? [] : state.nearbyStations;
      
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
          nearbyStations: newNearbyStations,
      };
  }),
  setDetectedMode: (mode) => set({ detectedMode: mode }),
  setConfirmedMode: (mode) => set((state) => {
      saveToLocalStorage(state.route, state.isTracking, mode);
      return { confirmedMode: mode, detectedMode: null };
  }),
  nearbyStations: [],
  selectedStation: null,
  showTicketModal: false,
  cityCode: DEFAULT_CITY_CODE,
  tourismNews: null,
  toast: null,
  setNearbyStations: (stations) => set({ nearbyStations: stations }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setShowTicketModal: (show) => set({ showTicketModal: show }),
  setCityCode: (code) => set({ cityCode: code }),
  setTourismNews: (news) => set({ tourismNews: news }),
  setToast: (toast) => set({ toast }),
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

