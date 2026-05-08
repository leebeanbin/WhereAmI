import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import {
  Journey,
  fetchJourneys,
  formatDistance,
  formatDuration,
  DEFAULT_USER_ID,
} from '@whereami/core';
import { WEB_BASE_URL } from '@/constants';

function JourneyCard({ item }: { item: Journey }) {
  const handleShare = () => {
    Linking.openURL(`${WEB_BASE_URL}/share/${item.shareId}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
          {new Date(item.startTime).toLocaleDateString('ko-KR')}
        </Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>🔗 공유</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.stat}>
        {formatDistance(item.totalDistanceKm)}  ·  {formatDuration(item.totalDurationSec)}
      </Text>
      <Text style={styles.id}>ID: {item.shareId}</Text>
    </View>
  );
}

export function HistoryScreen() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchJourneys(DEFAULT_USER_ID)
      .then(setJourneys)
      .catch((e) => {
        console.error(e);
        setError('기록을 불러오는데 실패했습니다.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mono}>클라우드에서 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (journeys.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.mono}>아직 저장된 모험이 없어요!</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={journeys}
        keyExtractor={j => j.journeyId}
        renderItem={({ item }) => <JourneyCard item={item} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e8e0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  mono: { fontFamily: 'monospace' },
  errorText: { fontFamily: 'monospace', color: '#e00', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#92cc41',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'black',
  },
  retryBtnText: { fontFamily: 'monospace', fontWeight: 'bold' },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderWidth: 2,
    borderColor: 'black',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: 'monospace', fontSize: 13, color: '#333' },
  shareBtn: {
    backgroundColor: '#e0e8e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: 'black',
  },
  shareBtnText: { fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  stat: { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  id: { fontFamily: 'monospace', fontSize: 9, color: '#aaa', marginTop: 8 },
});
