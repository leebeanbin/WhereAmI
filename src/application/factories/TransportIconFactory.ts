import { TransportMode } from '../../domain/models/Journey';

export interface IconOptions {
  busType?: 'blue' | 'red' | 'yellow' | 'green';
  trainLine?: 'seoul_1' | 'seoul_2' | 'seoul_3' | 'seoul_4' | 'seoul_5' | 'seoul_6' | 'seoul_7' | 'seoul_8' | 'seoul_9';
  gender?: 'man' | 'woman';
}

export class TransportIconFactory {
  static getIconPath(mode: TransportMode | null, options?: IconOptions): string {
    switch (mode) {
      case 'walk':
        return options?.gender === 'woman' ? '/icons/walk_woman.png' : '/icons/walk_man.png';
      case 'bus':
        if (options?.busType === 'red') return '/icons/bus_red.png';
        if (options?.busType === 'yellow') return '/icons/bus_yellow.png';
        if (options?.busType === 'green') return '/icons/bus_green.png';
        return '/icons/bus_blue.png';
      case 'train':
        if (options?.trainLine) {
          return `/icons/train_${options.trainLine}.png`;
        }
        return '/icons/train_seoul_1.png';
      default:
        return '/icons/banana.png';
    }
  }

  static getModeText(mode: TransportMode | null): string {
    switch (mode) {
      case 'walk': return '도보';
      case 'bus': return '버스';
      case 'train': return '기차/지하철';
      default: return '알 수 없음';
    }
  }

  static getStationMarkerPath(type: 'bus' | 'subway' | 'train'): string {
    switch (type) {
      case 'subway': return '/icons/subway_station.png';
      case 'train': return '/icons/train_station.png';
      default: return '/icons/bus_stop.png';
    }
  }
}
