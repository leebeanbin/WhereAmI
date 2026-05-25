import { useLocationStore } from '@/store/useLocationStore';

let audioCtx: AudioContext | null = null;

// AudioContext가 필요할 때 지연 초기화 (브라우저 자동재생 방지 정책 준수)
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // 만약 오디오 컨텍스트가 정지 상태(suspended)라면 활성화를 시도함
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

/**
 * 8비트 비프음을 재생하는 헬퍼 함수
 * @param frequency 주파수 (Hz)
 * @param type 오실레이터 파형 ('square' | 'sawtooth' | 'triangle' | 'sine')
 * @param duration 재생 시간 (초)
 * @param volume 볼륨 (0.0 ~ 1.0)
 * @param pitchSlideEndFrequency 피치 슬라이드가 필요할 때 마지막 주파수 (Hz)
 */
function playTone(
  frequency: number,
  type: 'square' | 'sawtooth' | 'triangle' | 'sine',
  duration: number,
  volume: number = 0.15,
  pitchSlideEndFrequency?: number
) {
  const store = useLocationStore.getState();
  // 전역 사운드 토글이 꺼져 있으면 연주하지 않음
  if (!store.soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  if (pitchSlideEndFrequency !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(pitchSlideEndFrequency, ctx.currentTime + duration);
  }

  // 볼륨 엔벨로프 (레트로 특유의 뚝 끊기는 음 및 볼륨 디케이 구현)
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * 1. 모험 시작 효과음 (경쾌하게 도약하는 8비트 코인 소리)
 */
export function playCoinSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // 첫 번째 노트 (B5, 988Hz)
  playTone(987.77, 'square', 0.08, 0.12);
  
  // 0.08초 후에 두 번째 노트 (E6, 1319Hz)
  setTimeout(() => {
    playTone(1318.51, 'square', 0.22, 0.12);
  }, 80);
}

/**
 * 2. 모험 종료 효과음 (디센딩되는 8비트 파워 다운 베이스 주파수)
 */
export function playPowerDownSound() {
  // 350Hz에서 80Hz로 0.4초간 피치 급하강
  playTone(350, 'triangle', 0.45, 0.18, 80);
}

/**
 * 3. 스탬프 찍기 및 레벨업 효과음 (8비트 팡파르 메로디)
 */
export function playLevelUpSound() {
  const notes = [
    { freq: 523.25, dur: 0.08 }, // C5
    { freq: 659.25, dur: 0.08 }, // E5
    { freq: 783.99, dur: 0.08 }, // G5
    { freq: 1046.50, dur: 0.25 }, // C6
  ];

  notes.forEach((note, idx) => {
    setTimeout(() => {
      playTone(note.freq, 'square', note.dur, 0.12);
    }, idx * 80);
  });
}

/**
 * 4. 토스트 알림 / 비프음 (짧고 맑은 주파수음)
 */
export function playBeepSound() {
  playTone(880, 'sine', 0.12, 0.1);
}

/**
 * 5. 버튼 클릭음 (레트로 오락실 목각 두드리는 느낌)
 */
export function playClickSound() {
  // 1200Hz에서 100Hz로 0.04초만에 초고속 디케이
  playTone(1200, 'triangle', 0.05, 0.15, 100);
}

/**
 * 6. 일반 요소 호버 또는 탭음
 */
export function playBipSound() {
  playTone(587.33, 'sine', 0.04, 0.05);
}
