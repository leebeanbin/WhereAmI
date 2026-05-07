import React from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ReactNativeGeolocationAdapter } from '@/adapters/ReactNativeGeolocationAdapter';

/**
 * 앱 진입점.
 * ReactNativeGeolocationAdapter를 생성하여 TrackingScreen에 주입.
 * 어댑터만 교체하면 위치 추적 구현을 바꿀 수 있음 (ILocationAdapter 계약 준수).
 */
const geolocationAdapter = new ReactNativeGeolocationAdapter();

export default function App() {
  return <AppNavigator geolocationAdapter={geolocationAdapter} />;
}
