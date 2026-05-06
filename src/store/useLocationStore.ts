import { create } from 'zustand';
import { RoutePoint } from '../domain/models/Journey';
import { StationInfo } from '../domain/interfaces/IPublicTransportAdapter';

export type { RoutePoint };
export type TransportMode = 'walk' | 'bus' | 'train' | null;

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
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  route: [],
  isTracking: false,
  detectedMode: null,
  confirmedMode: 'walk',
  emaSpeed: 0,
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  addRoutePoint: (point) => set((state) => ({ 
      route: [...state.route, point],
      emaSpeed: point.emaSpeedKmh
  })),
  toggleTracking: () => set((state) => ({ 
      isTracking: !state.isTracking,
      // Optional: reset route on new tracking session
      // route: !state.isTracking ? [] : state.route 
  })),
  setDetectedMode: (mode) => set({ detectedMode: mode }),
  setConfirmedMode: (mode) => set({ confirmedMode: mode, detectedMode: null }),
  nearbyStations: [],
  selectedStation: null,
  showTicketModal: false,
  cityCode: '25', // Default: 대전
  tourismNews: null,
  toast: null,
  setNearbyStations: (stations) => set({ nearbyStations: stations }),
  setSelectedStation: (station) => set({ selectedStation: station }),
  setShowTicketModal: (show) => set({ showTicketModal: show }),
  setCityCode: (code) => set({ cityCode: code }),
  setTourismNews: (news) => set({ tourismNews: news }),
  setToast: (toast) => set({ toast }),
}));
