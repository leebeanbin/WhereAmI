import * as Location from 'expo-location';
import { ILocationAdapter, AppError, ErrorCode } from '@whereami/core';

/**
 * ILocationAdapter의 Expo SDK 54 구현체.
 * expo-location을 사용하므로 iOS/Android 권한 처리가 통일되고
 * Expo Managed Workflow와 완전히 호환됩니다.
 *
 * GeolocationAdapter(web)와 완전히 교환 가능 — ILocationAdapter 계약 준수.
 */
export class ExpoLocationAdapter implements ILocationAdapter {
  private subscription: Location.LocationSubscription | null = null;
  private stopped = false;

  async startTracking(
    onUpdate: (data: { lat: number; lng: number; time: number }) => void,
    onError: (err: Error) => void,
  ): Promise<void> {
    this.stopped = false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (this.stopped) return;
    if (status !== 'granted') {
      onError(new AppError(ErrorCode.GPS_DENIED));
      return;
    }

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,   // 5m 이동 시마다 업데이트 (배터리 최적화)
        timeInterval: 3000,    // 최소 3초 간격
      },
      (location) => {
        onUpdate({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          time: location.timestamp,
        });
      },
    );
  }

  stopTracking(): void {
    this.stopped = true;
    this.subscription?.remove();
    this.subscription = null;
  }
}
