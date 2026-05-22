/**
 * AdventureGuideSheet.tsx
 * 
 * 모험가이드 버튼(🧭)을 눌렀을 때 현재 내 위치를 기준으로
 * 주변 관광 명소 및 정류장을 확인하고 길찾기 연동을 지원하는 모바일용 바텀 시트입니다.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocationStore } from '@whereami/core';
import type { ApiBody } from '../../../src/lib/apiResponse';
import type { TourismItemDto } from '../../../src/application/dtos/TourismDto';

interface AdventureGuideSheetProps {
  visible: boolean;
  onClose: () => void;
}

type Tab = 'tour' | 'stations';

const BFF_BASE =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://whereami.vercel.app';

export function AdventureGuideSheet({ visible, onClose }: AdventureGuideSheetProps) {
  const { currentLocation, nearbyStations, setSelectedStation, setToast } = useLocationStore();
  const [activeTab, setActiveTab] = useState<Tab>('tour');
  const [attractions, setAttractions] = useState<TourismItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(450)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 250,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [visible]);

  // 내 위치 기반 추천 명소 조회
  useEffect(() => {
    if (!visible || !currentLocation || activeTab !== 'tour') return;

    setLoading(true);
    setError(null);
    fetch(`${BFF_BASE}/api/tourism?lat=${currentLocation.lat}&lng=${currentLocation.lng}&radius=2000`)
      .then((res) => res.json() as Promise<ApiBody<{ items: TourismItemDto[] }>>)
      .then((body) => {
        if (body.success) {
          setAttractions(body.data.items);
        } else {
          setError('추천 명소를 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('네트워크 통신 장해 발생'))
      .finally(() => setLoading(false));
  }, [visible, currentLocation, activeTab]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🧭 모험 & 관광 가이드</Text>
          <Text style={styles.subTitle}>8-Bit Exploration Assistant</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* 탭 버튼 */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('tour')}
          style={[styles.tab, activeTab === 'tour' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'tour' && styles.tabTextActive]}>
            🗺️ 추천 명소
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('stations')}
          style={[styles.tab, activeTab === 'stations' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'stations' && styles.tabTextActive]}>
            🚏 주변 정류장
          </Text>
        </Pressable>
      </View>

      {/* 가이드 콘텐츠 리스트 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!currentLocation ? (
          <View style={styles.centerContainer}>
            <Text style={styles.bigEmoji}>📡</Text>
            <Text style={styles.errorText}>GPS 신호를 검색 중입니다.</Text>
            <Text style={styles.descText}>
              수신이 활성화되면 주변 명소 및 대중교통 정류장 스캔 목록이 자동 동기화됩니다!
            </Text>
          </View>
        ) : loading ? (
          <Text style={styles.loadingText}>모험 신호 해독 및 지형 스캔 중...</Text>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : activeTab === 'tour' ? (
          attractions.length === 0 ? (
            <Text style={styles.emptyText}>반경 2km 내 추천 모험 지역이 존재하지 않습니다.</Text>
          ) : (
            attractions.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <View style={styles.infoCol}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>{item.address}</Text>
                  <Text style={styles.itemDist}>거리: {item.dist}m</Text>
                </View>
                <Pressable
                  onPress={() => {
                    const url = `https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.mapY},${item.mapX}`;
                    Linking.openURL(url).catch(console.error);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>🚩 길찾기</Text>
                </Pressable>
              </View>
            ))
          )
        ) : (
          nearbyStations.length === 0 ? (
            <Text style={styles.emptyText}>주변에 확인 가능한 정류소 시설물이 탐지되지 않았습니다.</Text>
          ) : (
            nearbyStations.map((station, idx) => (
              <View key={idx} style={styles.row}>
                <View style={styles.infoCol}>
                  <Text style={styles.itemTitle} numberOfLines={1}>🚏 {station.stationName}</Text>
                  <Text style={styles.itemSub}>타입: {station.type === 'subway' ? '지하철역' : '버스정류장'}</Text>
                </View>
                <View style={styles.btnRow}>
                  <Pressable
                    onPress={() => {
                      const url = `https://map.kakao.com/link/to/${encodeURIComponent(station.stationName)},${station.lat},${station.lng}`;
                      Linking.openURL(url).catch(console.error);
                    }}
                    style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}
                  >
                    <Text style={styles.actionBtnText}>🚩 길찾기</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setSelectedStation(station);
                      setToast({
                        message: `🚏 [${station.stationName}] 전광판 열림! 도착 정보를 스캔하세요.`,
                        type: 'success',
                      });
                      onClose();
                    }}
                    style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                  >
                    <Text style={styles.actionBtnText}>🔍 전광판</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )
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
    maxHeight: 330,
    zIndex: 160,
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
  title: {
    fontFamily: 'monospace',
    fontSize: 15,
    color: '#fde68a',
    fontWeight: 'bold',
  },
  subTitle: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#888',
    marginTop: 2,
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
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
  },
  tabActive: { borderColor: '#3b82f6', backgroundColor: '#1d4ed8' },
  tabText: { fontFamily: 'monospace', fontSize: 10, color: '#aaa', fontWeight: 'bold' },
  tabTextActive: { color: 'white' },
  content: { paddingHorizontal: 12, paddingBottom: 24 },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  bigEmoji: { fontSize: 28, marginBottom: 8 },
  loadingText: { fontFamily: 'monospace', fontSize: 11, color: '#00ff00', textAlign: 'center', marginTop: 24, fontWeight: 'bold' },
  errorText: { fontFamily: 'monospace', fontSize: 11, color: '#f87171', textAlign: 'center', fontWeight: 'bold' },
  descText: { fontFamily: 'monospace', fontSize: 9, color: '#555', textAlign: 'center', marginTop: 4, lineHeight: 12 },
  emptyText: { fontFamily: 'monospace', fontSize: 10, color: '#666', textAlign: 'center', marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoCol: { flex: 1, marginRight: 8 },
  itemTitle: { fontFamily: 'monospace', fontSize: 12, color: '#fde68a', fontWeight: 'bold' },
  itemSub: { fontFamily: 'monospace', fontSize: 9, color: '#9ca3af', marginTop: 2 },
  itemDist: { fontFamily: 'monospace', fontSize: 9, color: '#10b981', fontWeight: 'bold', marginTop: 1 },
  btnRow: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    backgroundColor: '#eab308',
    borderWidth: 1.5,
    borderColor: 'black',
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: 'white', fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold' },
});
