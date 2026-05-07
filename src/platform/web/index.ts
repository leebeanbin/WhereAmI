import { GeolocationAdapter } from '../../infrastructure/adapters/GeolocationAdapter';
import type { PlatformConfig } from '../types';

/**
 * 웹(Next.js) 플랫폼 어댑터 등록.
 * GeolocationAdapter는 navigator.geolocation을 사용하며 브라우저 전용.
 */
export const webPlatformConfig: PlatformConfig = {
  geolocation: new GeolocationAdapter(),
  bffBaseUrl: '',
};
