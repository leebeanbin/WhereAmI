import { ILocationAdapter } from '../../domain/interfaces/ILocationAdapter';
import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode } from '../../constants/ResponseCodes';
import { GEO_MAXIMUM_AGE_MS, GEO_TIMEOUT_MS } from '../../constants/api';

export class GeolocationAdapter implements ILocationAdapter {
  private watchId: number | null = null;

  startTracking(onUpdate: (data: {lat: number, lng: number, time: number}) => void, onError: (err: Error) => void) {
    if (!('geolocation' in navigator)) {
      // 하드코딩된 문자열 대신 Enum 기반의 Custom AppError 던짐
      onError(new AppError(ErrorCode.GPS_UNAVAILABLE));
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        onUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          time: Date.now()
        });
      },
      (err) => {
        // 브라우저 네이티브 에러 코드를 내부 AppError 코드로 변환
        if (err.code === err.PERMISSION_DENIED) onError(new AppError(ErrorCode.GPS_DENIED));
        else if (err.code === err.TIMEOUT) onError(new AppError(ErrorCode.GPS_TIMEOUT));
        else onError(new AppError(ErrorCode.GPS_UNAVAILABLE));
      },
      { enableHighAccuracy: true, maximumAge: GEO_MAXIMUM_AGE_MS, timeout: GEO_TIMEOUT_MS }
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
