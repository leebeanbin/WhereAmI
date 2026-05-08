import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import {
  useLocationStore,
  useTrackingFacade,
  TransportIconFactory,
  ILocationAdapter,
} from '@whereami/core';
import { JourneyReceiptModal } from '@/components/JourneyReceiptModal';
import { TransportModeModal } from '@/components/TransportModeModal';

const POLYLINE_COLORS: Record<string, string> = {
  walk: '#00FF00',
  bus: '#0000FF',
  train: '#FF0000',
};

interface Props {
  geolocationAdapter: ILocationAdapter;
}

export function TrackingScreen({ geolocationAdapter }: Props) {
  const { startTracking, stopTracking } = useTrackingFacade(geolocationAdapter);
  const {
    currentLocation, route, isTracking, emaSpeed,
    confirmedMode, setDetectedMode,
  } = useLocationStore();

  const modeText = TransportIconFactory.getModeText(confirmedMode);

  return (
    <SafeAreaView style={styles.container}>
      {currentLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {route.length > 1 && (
            <Polyline
              coordinates={route.map(p => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={POLYLINE_COLORS[confirmedMode ?? 'walk']}
              strokeWidth={4}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.waitText}>GPS 신호 대기 중...</Text>
        </View>
      )}

      {/* 속도/수단 HUD */}
      <View style={styles.hud}>
        <Text style={styles.modeText}>{modeText}</Text>
        <Text style={styles.speedText}>{emaSpeed.toFixed(1)} km/h</Text>
      </View>

      {/* 개발용 MOCK 버튼 */}
      {__DEV__ && (
        <View style={styles.mockRow}>
          <TouchableOpacity style={styles.mockBtn} onPress={() => setDetectedMode('bus')}>
            <Text style={styles.mockBtnText}>[MOCK:버스]</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mockBtn} onPress={() => setDetectedMode('train')}>
            <Text style={styles.mockBtnText}>[MOCK:기차]</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, isTracking ? styles.btnStop : styles.btnStart]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.btnText}>
          {isTracking ? '■ 모험 종료' : '▶ 모험 시작'}
        </Text>
      </TouchableOpacity>

      <JourneyReceiptModal />
      <TransportModeModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e8e0' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitText: { fontFamily: 'monospace', color: '#666' },
  hud: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'white',
    padding: 12,
    borderWidth: 2,
    borderColor: 'black',
  },
  modeText: { fontFamily: 'monospace', fontSize: 12 },
  speedText: { fontFamily: 'monospace', fontSize: 20, color: '#e00' },
  mockRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  mockBtn: {
    backgroundColor: '#f6c90e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'black',
  },
  mockBtnText: { fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold' },
  btn: {
    margin: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'black',
  },
  btnStart: { backgroundColor: '#92cc41' },
  btnStop: { backgroundColor: '#e76e55' },
  btnText: { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
});
