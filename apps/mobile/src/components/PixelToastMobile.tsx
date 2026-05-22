/**
 * PixelToastMobile.tsx
 *
 * 모바일용 레트로 알림(Toast) 컴포넌트.
 * useLocationStore의 toast 상태를 구독하여 화면에 애니메이션과 함께 표시합니다.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useLocationStore } from '@whereami/core';

export function PixelToastMobile() {
  const { toast, setToast } = useLocationStore();
  const [toastToRender, setToastToRender] = useState(toast);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (toast) {
      setToastToRender(toast);
      // 애니메이션 재생
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // 3.5초 후 자동 종료
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 30,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToastToRender(null);
          setToast(null);
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toastToRender) return null;

  const isError = toastToRender.type === 'error';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        isError ? styles.errorBg : styles.successBg,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{isError ? '💦' : '✨'}</Text>
        <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>
          {toastToRender.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    zIndex: 300,
    borderWidth: 3,
    borderColor: 'black',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  successBg: {
    backgroundColor: '#f0fdf4', // green-50
    borderColor: '#22c55e', // green-500
  },
  errorBg: {
    backgroundColor: '#fef2f2', // red-50
    borderColor: '#ef4444', // red-500
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  successText: {
    color: '#15803d', // green-700
  },
  errorText: {
    color: '#b91c1c', // red-700
  },
});
