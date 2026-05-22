/**
 * TourismToast.tsx
 *
 * 모험 중 주변 2km 이내 관광명소 감지 시 화면 상단에 표시되는 팝업 알림.
 * 웹의 TourismNewsTicker와 동일한 useLocationStore 상태를 공유합니다.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocationStore } from '@whereami/core';

export function TourismToast() {
  const { tourismNews, setTourismNews } = useLocationStore();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!tourismNews) return;

    // 위에서 슬라이드 인
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 8초 후 자동 닫기
    const timer = setTimeout(() => dismiss(), 8000);
    return () => clearTimeout(timer);
  }, [tourismNews]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setTourismNews(null));
  };

  if (!tourismNews) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Pressable onPress={dismiss} style={styles.inner}>
        <Text style={styles.bell}>🔔</Text>
        <View style={styles.textBox}>
          <Text style={styles.label}>[주변 명소 속보]</Text>
          <Text style={styles.body} numberOfLines={2}>
            앗! 방금{' '}
            <Text style={styles.highlight}>'{tourismNews.title}'</Text>{' '}
            근처({tourismNews.distance}m)를 지나셨어요!
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    zIndex: 200,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: 'black',
    backgroundColor: '#fef08a', // yellow-200
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  bell: { fontSize: 24 },
  textBox: { flex: 1 },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#dc2626', // red-600
    fontWeight: 'bold',
    marginBottom: 2,
  },
  body: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#111',
    lineHeight: 16,
  },
  highlight: {
    color: '#2563eb', // blue-600
    fontWeight: 'bold',
  },
});
