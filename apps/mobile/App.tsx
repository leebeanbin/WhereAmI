import React from 'react';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ExpoLocationAdapter } from '@/adapters/ExpoLocationAdapter';

const locationAdapter = new ExpoLocationAdapter();

export default function App() {
  return <AppNavigator geolocationAdapter={locationAdapter} />;
}
