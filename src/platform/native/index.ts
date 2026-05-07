/**
 * React Native 플랫폼 어댑터 (구현 필요).
 *
 * 아이폰 앱 개발 시 이 파일을 아래 예시처럼 구현하세요.
 *
 * 1. 패키지 설치:
 *    npm install react-native-geolocation-service
 *
 * 2. 어댑터 구현:
 *
 *    import Geolocation from 'react-native-geolocation-service';
 *    import { ILocationAdapter } from '../../domain/interfaces/ILocationAdapter';
 *    import { AppError } from '../../domain/exceptions/AppError';
 *    import { ErrorCode } from '../../constants/ResponseCodes';
 *
 *    class ReactNativeGeolocationAdapter implements ILocationAdapter {
 *      private watchId: number | null = null;
 *
 *      startTracking(onUpdate, onError) {
 *        this.watchId = Geolocation.watchPosition(
 *          (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude, time: Date.now() }),
 *          (err) => onError(new AppError(ErrorCode.GPS_UNAVAILABLE)),
 *          { enableHighAccuracy: true, distanceFilter: 5 }
 *        );
 *      }
 *
 *      stopTracking() {
 *        if (this.watchId !== null) Geolocation.clearWatch(this.watchId);
 *      }
 *    }
 *
 * 3. PlatformConfig 등록:
 *
 *    export const nativePlatformConfig: PlatformConfig = {
 *      geolocation: new ReactNativeGeolocationAdapter(),
 *      bffBaseUrl: 'https://whereami.vercel.app',
 *    };
 */

export {};
