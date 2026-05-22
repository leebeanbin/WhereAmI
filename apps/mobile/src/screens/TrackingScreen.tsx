import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import {
  useLocationStore,
  useTrackingFacade,
  TransportIconFactory,
  ILocationAdapter,
} from '@whereami/core';
import { JourneyReceiptModal } from '@/components/JourneyReceiptModal';
import { TransportModeModal } from '@/components/TransportModeModal';
import { TourismToast } from '@/components/TourismToast';
import { NearbyStationSheet } from '@/components/NearbyStationSheet';
import { PixelToastMobile } from '@/components/PixelToastMobile';

const POLYLINE_COLORS: Record<string, string> = {
  walk: '#22c55e',   // green-500
  bus:  '#3b82f6',   // blue-500
  train: '#ef4444',  // red-500
};

interface Props {
  geolocationAdapter: ILocationAdapter;
}

export function TrackingScreen({ geolocationAdapter }: Props) {
  const { startTracking, stopTracking } = useTrackingFacade(geolocationAdapter);
  const {
    currentLocation, route, isTracking, emaSpeed,
    confirmedMode, nearbyStations, setSelectedStation,
  } = useLocationStore();

  const modeText = TransportIconFactory.getModeText(confirmedMode);

  // HUD 위젯 탭해서 숨기기/다시 보기
  const [showHud, setShowHud] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* 지도 */}
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
          {/* 이동 경로 폴리라인 */}
          {route.length > 1 && (
            <Polyline
              coordinates={route.map(p => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={POLYLINE_COLORS[confirmedMode ?? 'walk']}
              strokeWidth={4}
            />
          )}

          {/* 주변 정류장 마커 */}
          {nearbyStations.map((station) => (
            <Marker
              key={station.stationId}
              coordinate={{ latitude: station.lat, longitude: station.lng }}
              title={station.stationName}
              onPress={() => setSelectedStation(station)}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.waitText}>📡 GPS 신호 대기 중...</Text>
        </View>
      )}

      {/* 속도 HUD 위젯 — 탭하면 닫힘 */}
      {isTracking && currentLocation && showHud && (
        <Pressable style={styles.hud} onPress={() => setShowHud(false)}>
          <Text style={styles.hudLabel}>SPEED</Text>
          <Text style={styles.speedText}>{emaSpeed.toFixed(1)}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
          <Text style={styles.modeText}>{modeText}</Text>
          <Text style={styles.hudHint}>탭해서 닫기</Text>
        </Pressable>
      )}

      {/* HUD 숨겨진 상태일 때 미니 버튼 */}
      {isTracking && currentLocation && !showHud && (
        <Pressable style={styles.hudMini} onPress={() => setShowHud(true)}>
          <Text style={styles.hudMiniText}>⚡ {emaSpeed.toFixed(0)}</Text>
        </Pressable>
      )}

      {/* 개발용 MOCK 버튼 (DEV 빌드에서만 보임) */}
      {__DEV__ && (() => {
        const { setDetectedMode } = useLocationStore.getState();
        return (
          <View style={styles.mockRow}>
            <TouchableOpacity style={styles.mockBtn} onPress={() => setDetectedMode('bus')}>
              <Text style={styles.mockBtnText}>[MOCK:버스]</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mockBtn} onPress={() => setDetectedMode('train')}>
              <Text style={styles.mockBtnText}>[MOCK:기차]</Text>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* 모험 시작/종료 버튼 */}
      <TouchableOpacity
        style={[styles.btn, isTracking ? styles.btnStop : styles.btnStart]}
        onPress={isTracking ? stopTracking : startTracking}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>
          {isTracking ? '■ 모험 종료' : '▶ 모험 시작'}
        </Text>
      </TouchableOpacity>

      {/* 오버레이 컴포넌트들 */}
      <TourismToast />
      <NearbyStationSheet />
      <JourneyReceiptModal />
      <TransportModeModal />
      <PixelToastMobile />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e8e0' },
  map: { flex: 1 },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  waitText: { fontFamily: 'monospace', fontSize: 14, color: '#555' },

  // 속도 HUD 위젯
  hud: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderWidth: 3,
    borderColor: 'black',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    minWidth: 90,
  },
  hudLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#888',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  speedText: {
    fontFamily: 'monospace',
    fontSize: 28,
    color: '#dc2626',
    fontWeight: 'bold',
    lineHeight: 32,
  },
  speedUnit: { fontFamily: 'monospace', fontSize: 10, color: '#aaa' },
  modeText: { fontFamily: 'monospace', fontSize: 11, color: '#444', marginTop: 2 },
  hudHint: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#ccc',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderStyle: 'dashed',
    paddingTop: 2,
  },

  // 미니 HUD (숨긴 상태)
  hudMini: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hudMiniText: { fontFamily: 'monospace', fontSize: 11, color: '#dc2626', fontWeight: 'bold' },

  // MOCK 버튼 (DEV only)
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

  // 시작/종료 버튼
  btn: {
    margin: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  btnStart: { backgroundColor: '#92cc41' },
  btnStop:  { backgroundColor: '#e76e55' },
  btnText: { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' },
});
