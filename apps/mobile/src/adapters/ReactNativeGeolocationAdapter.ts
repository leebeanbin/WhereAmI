import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { ILocationAdapter } from '@whereami/core';
import { AppError, ErrorCode } from '@whereami/core';

/**
 * ILocationAdapter의 React Native 구현체.
 * GeolocationAdapter(web)와 완전히 교환 가능 — ILocationAdapter 계약을 동일하게 만족.
 */
export class ReactNativeGeolocationAdapter implements ILocationAdapter {
  private watchId: number | null = null;

  async startTracking(
    onUpdate: (data: { lat: number; lng: number; time: number }) => void,
    onError: (err: Error) => void,
  ) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      onError(new AppError(ErrorCode.GPS_DENIED));
      return;
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        onUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          time: Date.now(),
        });
      },
      (err) => {
        if (err.code === 1) onError(new AppError(ErrorCode.GPS_DENIED));
        else if (err.code === 3) onError(new AppError(ErrorCode.GPS_TIMEOUT));
        else onError(new AppError(ErrorCode.GPS_UNAVAILABLE));
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,     // 5m 이동 시마다 업데이트 (배터리 최적화)
        interval: 3000,        // Android: 최소 3초 간격
        fastestInterval: 1000,
      },
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
}
