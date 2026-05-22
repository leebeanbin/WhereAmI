import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  useLocationStore,
  getDistanceFromLatLonInKm,
  formatDistance,
  formatDuration,
} from '@whereami/core';

const MS_PER_SECOND = 1000;

export function JourneyReceiptModal() {
  const { showTicketModal, setShowTicketModal, route } = useLocationStore();

  const stats = useMemo(() => {
    let maxSpeed = 0, walkCount = 0, busCount = 0, trainCount = 0, totalDistanceKm = 0;
    const checkedInStations: string[] = [];

    route.forEach((p, i) => {
      if (p.speedKmh > maxSpeed) maxSpeed = p.speedKmh;
      if (p.confirmedMode === 'walk') walkCount++;
      else if (p.confirmedMode === 'bus') busCount++;
      else if (p.confirmedMode === 'train') trainCount++;
      if (p.visitedStationName && !checkedInStations.includes(p.visitedStationName)) {
        checkedInStations.push(p.visitedStationName);
      }
      if (i > 0) {
        totalDistanceKm += getDistanceFromLatLonInKm(
          route[i - 1].lat, route[i - 1].lng, p.lat, p.lng,
        );
      }
    });

    const durationSec = route.length > 1
      ? (route[route.length - 1].time - route[0].time) / MS_PER_SECOND
      : 0;

    const primaryMode =
      busCount > walkCount && busCount > trainCount ? '버스 🚌' :
      trainCount > walkCount && trainCount > busCount ? '기차/지하철 🚆' :
      '도보 🚶';

    return { maxSpeed, primaryMode, totalDistanceKm, durationSec, checkedInStations };
  }, [route]);

  return (
    <Modal
      visible={showTicketModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTicketModal(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>RECEIPT</Text>
          <Text style={styles.subtitle}>Where Am I - Journey Ticket</Text>

          <View style={styles.divider} />

          <ScrollView style={styles.rows} showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <Text style={styles.label}>발급일시</Text>
              <Text style={styles.value}>{new Date().toLocaleString('ko-KR')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>총 거리</Text>
              <Text style={[styles.value, styles.blue]}>{formatDistance(stats.totalDistanceKm)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>소요 시간</Text>
              <Text style={[styles.value, styles.purple]}>{formatDuration(stats.durationSec)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>주요 수단</Text>
              <Text style={[styles.value, styles.green]}>{stats.primaryMode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>최고 속도</Text>
              <Text style={[styles.value, styles.red]}>{stats.maxSpeed.toFixed(1)} km/h</Text>
            </View>

            {stats.checkedInStations.length > 0 && (
              <View style={styles.stampBookSection}>
                <Text style={styles.stampBookTitle}>STAMP BOOK</Text>
                <View style={styles.stampsGrid}>
                  {stats.checkedInStations.map((st, i) => (
                    <View key={i} style={styles.stampChip}>
                      <Text style={styles.stampChipText}>📍 {st}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.btn} onPress={() => setShowTicketModal(false)}>
            <Text style={styles.btnText}>확인 및 닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 3,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  title: { fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', textAlign: 'center', letterSpacing: 6 },
  subtitle: { fontFamily: 'monospace', fontSize: 9, color: '#888', textAlign: 'center', marginTop: 4 },
  divider: { borderBottomWidth: 2, borderStyle: 'dashed', borderColor: '#ccc', marginVertical: 16 },
  rows: { maxHeight: 280 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  label: { fontFamily: 'monospace', fontSize: 12, color: '#888' },
  value: { fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' },
  blue: { color: '#2563eb' },
  purple: { color: '#7c3aed' },
  green: { color: '#16a34a' },
  red: { color: '#dc2626' },
  
  // 스탬프 북 스타일
  stampBookSection: {
    marginTop: 16,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    paddingTop: 12,
  },
  stampBookTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 2,
    marginBottom: 8,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stampChip: {
    backgroundColor: '#fef9c3', // yellow-100
    borderWidth: 1,
    borderColor: '#facc15', // yellow-400
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stampChipText: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#854d0e', // yellow-800
  },

  btn: {
    backgroundColor: '#92cc41',
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'black',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
  },
  btnText: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' },
});
