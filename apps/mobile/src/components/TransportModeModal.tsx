import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocationStore, TransportIconFactory } from '@whereami/core';

export function TransportModeModal() {
  const { detectedMode, emaSpeed, setDetectedMode, setConfirmedMode } = useLocationStore();

  const handleConfirm = () => {
    if (!detectedMode) return;
    setConfirmedMode(detectedMode);
    setDetectedMode(null);
  };

  return (
    <Modal
      visible={detectedMode !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setDetectedMode(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🚨</Text>
          <Text style={styles.title}>이동 수단 변경 감지!</Text>
          <Text style={styles.body}>
            속도 {emaSpeed.toFixed(1)} km/h{'\n\n'}
            혹시 지금{' '}
            <Text style={styles.bold}>
              {TransportIconFactory.getModeText(detectedMode)}
            </Text>
            (으)로 이동 중이신가요?
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.btnNo]}
              onPress={() => setDetectedMode(null)}
            >
              <Text style={styles.btnText}>아니오</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnYes]}
              onPress={handleConfirm}
            >
              <Text style={styles.btnText}>예 (변경)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    padding: 24,
    borderWidth: 4,
    borderColor: 'black',
    alignItems: 'center',
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  title: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  body: { fontFamily: 'monospace', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  bold: { fontWeight: 'bold', color: '#2563eb' },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'black',
  },
  btnNo: { backgroundColor: '#e76e55' },
  btnYes: { backgroundColor: '#92cc41' },
  btnText: { fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' },
});
