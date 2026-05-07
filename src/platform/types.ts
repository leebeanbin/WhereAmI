import type { ILocationAdapter } from '../domain/interfaces/ILocationAdapter';

/**
 * 플랫폼(Web / React Native / macOS Widget)이 반드시 제공해야 하는 의존성 계약.
 *
 * 새 플랫폼 추가 시:
 *   1. 이 인터페이스를 구현하는 PlatformConfig 객체를 만든다.
 *   2. src/platform/{platform}/index.ts 에 export 한다.
 *   3. 앱 진입점(layout.tsx 또는 App.tsx)에서 주입한다.
 */
export interface PlatformConfig {
  /** GPS 위치 추적 어댑터 */
  geolocation: ILocationAdapter;

  /**
   * BFF API 베이스 URL.
   * - Web: '' (상대 경로, 공백)
   * - React Native / macOS Widget: 'https://whereami.vercel.app' (배포된 서버 URL)
   */
  bffBaseUrl: string;
}
