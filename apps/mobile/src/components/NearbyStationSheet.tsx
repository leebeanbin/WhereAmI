/**
 * NearbyStationSheet.tsx
 *
 * 지도 위 정류장 마커를 탭했을 때 화면 하단에서 올라오는 시트.
 * 웹의 StationBillboard와 동일한 BFF API를 호출합니다.
 * (/api/transport, /api/subway, /api/train)
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import { useLocationStore } from '@whereami/core';
import type { ApiBody } from '../../../src/lib/apiResponse';
import type { SubwayArrivalDto, TrainDto } from '../../../src/application/dtos/TransportDto';
import { TransportSchedule } from '../../../src/domain/interfaces/IPublicTransportAdapter';
import { MS_PER_MINUTE } from '../../../src/constants/math';

type Tab = 'bus' | 'subway' | 'train' | 'tour';

const BFF_BASE =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://whereami.vercel.app';

function formatTrainTime(t: string): string {
  return t.length >= 12 ? `${t.slice(8, 10)}:${t.slice(10, 12)}` : t;
}

export function NearbyStationSheet() {
  const {
    selectedStation,
    setSelectedStation,
    cityCode,
    isTracking,
    route,
    checkInStation,
    setToast,
  } = useLocationStore();
  const [tab, setTab] = useState<Tab>('bus');
  const [schedules, setSchedules] = useState<TransportSchedule[]>([]);
  const [subwayArrivals, setSubwayArrivals] = useState<SubwayArrivalDto[]>([]);
  const [trains, setTrains] = useState<TrainDto[]>([]);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (!selectedStation) {
      // 닫기
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 280,
        useNativeDriver: true,
      }).start();
      return;
    }

    // 열기
    setTab(selectedStation.type === 'subway' ? 'subway' : 'bus');
    setSchedules([]); setSubwayArrivals([]); setTrains([]); setAttractions([]);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [selectedStation]);

  // 버스 조회
  useEffect(() => {
    if (!selectedStation || tab !== 'bus') return;
    setLoading(true);
    fetch(`${BFF_BASE}/api/transport?stationId=${selectedStation.stationId}&cityCode=${cityCode}`)
      .then(r => r.json() as Promise<ApiBody<TransportSchedule[]>>)
      .then(b => { if (b.success) setSchedules(b.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStation, tab, cityCode]);

  // 지하철 조회
  useEffect(() => {
    if (!selectedStation || tab !== 'subway') return;
    setLoading(true);
    const name = selectedStation.stationName.replace(/\s+\S*선.*$/, '');
    fetch(`${BFF_BASE}/api/subway?stationName=${encodeURIComponent(name)}`)
      .then(r => r.json() as Promise<ApiBody<SubwayArrivalDto[]>>)
      .then(b => { if (b.success) setSubwayArrivals(b.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStation, tab]);

  // 열차 조회
  useEffect(() => {
    if (!selectedStation || tab !== 'train') return;
    setLoading(true);
    const name = selectedStation.stationName.replace(/\s+\S*선.*$/, '').replace(/역$/, '');
    fetch(`${BFF_BASE}/api/train?depStationName=${encodeURIComponent(name)}`)
      .then(r => r.json() as Promise<ApiBody<TrainDto[]>>)
      .then(b => { if (b.success) setTrains(b.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStation, tab]);

  // 관광지 조회
  useEffect(() => {
    if (!selectedStation || tab !== 'tour') return;
    setLoading(true);
    fetch(`${BFF_BASE}/api/tourism?lat=${selectedStation.lat}&lng=${selectedStation.lng}&radius=2000`)
      .then(r => r.json() as Promise<ApiBody<{ items: any[] }>>)
      .then(b => { if (b.success) setAttractions(b.data.items); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStation, tab]);

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.stationName} numberOfLines={1}>🚏 {selectedStation?.stationName ?? ''}</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              if (!selectedStation) return;
              const url = `https://map.kakao.com/link/to/${encodeURIComponent(selectedStation.stationName)},${selectedStation.lat},${selectedStation.lng}`;
              Linking.openURL(url).catch(console.error);
            }}
            style={styles.directionsBtn}
          >
            <Text style={styles.directionsBtnText}>🚩 길찾기</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!selectedStation) return;
              if (!isTracking) {
                setToast({
                  message: '모험을 시작해야 기록을 남길 수 있습니다! 🚀',
                  type: 'error',
                });
                return;
              }
              if (route.length === 0) {
                setToast({
                  message: 'GPS 신호 수신 후 체크인할 수 있습니다. 📡',
                  type: 'error',
                });
                return;
              }
              checkInStation(selectedStation.stationId, selectedStation.stationName);
              setToast({
                message: `🚏 [${selectedStation.stationName}] 체크인 완료! 🎯`,
                type: 'success',
              });
            }}
            style={styles.checkInBtn}
          >
            <Text style={styles.checkInBtnText}>📍 기록</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedStation(null)} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        {(['bus', 'subway', 'train', 'tour'] as Tab[]).map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'bus' ? '🚌 버스' : t === 'subway' ? '🚇 지하철' : t === 'train' ? '🚆 열차' : '🗺️ 추천 명소'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && <Text style={styles.info}>신호 수신 중...</Text>}

        {!loading && tab === 'bus' && (
          schedules.length === 0
            ? <Text style={styles.info}>도착 예정 정보가 없습니다.</Text>
            : schedules.map((s, i) => {
                const diff = Math.round((new Date(s.estimatedArrivalTime).getTime() - Date.now()) / MS_PER_MINUTE);
                return (
                  <View key={i} style={styles.row}>
                    <Text style={styles.lineNo}>{s.lineNo}</Text>
                    <Text style={styles.direction}>{s.currentStop} 방면</Text>
                    <Text style={styles.arrival}>{diff <= 0 ? '곧 도착' : `${diff}분 후`}</Text>
                  </View>
                );
              })
        )}

        {!loading && tab === 'subway' && (
          subwayArrivals.length === 0
            ? <Text style={styles.info}>지하철 도착 정보가 없습니다.</Text>
            : subwayArrivals.map((a, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.lineNo}>{a.trainLineNm}</Text>
                  <Text style={[styles.arrival, { flex: 1, textAlign: 'right' }]}>{a.arvlMsg2}</Text>
                </View>
              ))
        )}

        {!loading && tab === 'train' && (
          trains.length === 0
            ? <Text style={styles.info}>출발 열차 정보가 없습니다.</Text>
            : trains.map((t, i) => (
                <View key={i} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineNo}>{t.trainTypeName}</Text>
                    <Text style={styles.direction}>→ {t.arrPlaceName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.arrival}>{formatTrainTime(t.depPlandTime)}</Text>
                    <Text style={[styles.direction, { fontSize: 9 }]}>도착 {formatTrainTime(t.arrPlandTime)}</Text>
                  </View>
                </View>
              ))
        )}

        {!loading && tab === 'tour' && (
          attractions.length === 0
            ? <Text style={styles.info}>주변 추천 명소가 없습니다.</Text>
            : attractions.map((attraction, i) => (
                <View key={i} style={[styles.row, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.lineNo, { color: '#fde68a' }]}>{attraction.title}</Text>
                    <Text style={[styles.direction, { fontSize: 10 }]}>{attraction.address}</Text>
                    <Text style={[styles.direction, { fontSize: 10, color: '#4ade80' }]}>거리: {attraction.dist}m</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      const url = `https://map.kakao.com/link/to/${encodeURIComponent(attraction.title)},${attraction.mapY},${attraction.mapX}`;
                      Linking.openURL(url).catch(console.error);
                    }}
                    style={styles.attractionDirBtn}
                  >
                    <Text style={styles.attractionDirBtnText}>🚩 길찾기</Text>
                  </Pressable>
                </View>
              ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: 'black',
    maxHeight: 320,
    zIndex: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directionsBtn: {
    backgroundColor: '#3b82f6', // blue-500
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtnText: {
    color: 'white',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 10,
  },
  checkInBtn: {
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnText: {
    color: 'white',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 10,
  },
  stationName: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#fde68a', // yellow-200
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: 'black',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    paddingBottom: 4,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: '#555',
  },
  tabActive: { borderColor: '#4ade80', backgroundColor: '#166534' },
  tabText: { fontFamily: 'monospace', fontSize: 10, color: '#aaa' },
  tabTextActive: { color: '#4ade80' },
  content: { paddingHorizontal: 12, paddingBottom: 20 },
  info: { fontFamily: 'monospace', fontSize: 12, color: '#666', textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  lineNo: { fontFamily: 'monospace', fontSize: 14, color: '#f87171', fontWeight: 'bold', minWidth: 40 },
  direction: { fontFamily: 'monospace', fontSize: 11, color: '#9ca3af', flex: 1 },
  arrival: { fontFamily: 'monospace', fontSize: 14, color: '#67e8f9' },
  attractionDirBtn: {
    backgroundColor: '#eab308', // yellow-500
    borderWidth: 1.5,
    borderColor: 'black',
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attractionDirBtnText: {
    color: 'black',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 9,
  },
});
