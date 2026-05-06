import { TransportMode } from '../../store/useLocationStore';

export interface IconOptions {
  busType?: 'blue' | 'red' | 'yellow' | 'green';
  trainLine?: 'seoul_1' | 'seoul_2';
  gender?: 'man' | 'woman';
}

export class TransportIconFactory {
  /**
   * 이동 수단에 맞는 마인크래프트 스타일 아이콘 경로를 반환합니다.
   * 한국 대중교통 색상 옵션을 지원합니다.
   */
  static getIconPath(mode: TransportMode | string | null, options?: IconOptions): string {
    switch (mode) {
      case 'walk': 
        return options?.gender === 'woman' ? '/icons/walk_woman.png' : '/icons/walk_man.png';
      case 'bus': 
        if (options?.busType === 'red') return '/icons/bus_red.png';
        if (options?.busType === 'yellow') return '/icons/bus_yellow.png';
        if (options?.busType === 'green') return '/icons/bus_green.png';
        return '/icons/bus_blue.png'; // 기본 간선버스
      case 'train': 
        if (options?.trainLine === 'seoul_2') return '/icons/train_seoul_2.png';
        return '/icons/train_seoul_1.png'; // 기본 서울 1호선
      case 'bike': return '/icons/bike.png';
      default: return '/icons/banana.png'; // 기본 아이콘 (나노 바나나)
    }
  }

  /**
   * 이동 수단에 맞는 한글 텍스트를 반환합니다.
   */
  static getModeText(mode: TransportMode | string | null): string {
    switch (mode) {
      case 'walk': return '도보';
      case 'bus': return '버스';
      case 'train': return '기차/지하철';
      case 'bike': return '자전거';
      default: return '알 수 없음';
    }
  }
}
