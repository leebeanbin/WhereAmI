import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import {
  Journey,
  fetchJourneys,
  formatDistance,
  formatDuration,
  DEFAULT_USER_ID,
} from '@whereami/core';

export function HistoryScreen() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneys(DEFAULT_USER_ID)
      .then(setJourneys)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mono}>클라우드에서 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={journeys}
        keyExtractor={j => j.journeyId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.date}>
              {new Date(item.startTime).toLocaleDateString('ko-KR')}
            </Text>
            <Text style={styles.stat}>
              {formatDistance(item.totalDistanceKm)}  ·  {formatDuration(item.totalDurationSec)}
            </Text>
            <Text style={styles.id}>ID: {item.shareId}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e0e8e0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mono: { fontFamily: 'monospace' },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderWidth: 2,
    borderColor: 'black',
  },
  date: { fontFamily: 'monospace', fontSize: 13, color: '#333' },
  stat: { fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  id: { fontFamily: 'monospace', fontSize: 9, color: '#aaa', marginTop: 8 },
});
