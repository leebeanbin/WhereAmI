import { ILocationAdapter } from '../../domain/interfaces/ILocationAdapter';
import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode } from '../../constants/ResponseCodes';
import { GEO_MAXIMUM_AGE_MS, GEO_TIMEOUT_MS } from '../../constants/api';

export class GeolocationAdapter implements ILocationAdapter {
  private highAccWatchId: number | null = null;
  private lowAccWatchId: number | null = null;

  async startTracking(
    onUpdate: (data: { lat: number; lng: number; time: number }) => void,
    onError: (err: Error) => void,
  ): Promise<void> {
    if (!('geolocation' in navigator)) {
      onError(new AppError(ErrorCode.GPS_UNAVAILABLE));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        time: Date.now(),
      });
    };

    // 1단계: 저정밀도(WiFi/IP) — Mac·실내에서도 즉시 위치 확보
    this.lowAccWatchId = navigator.geolocation.watchPosition(
      handleSuccess,
      () => {}, // 저정밀도 에러는 고정밀도가 커버하므로 무시
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 },
    );

    // 2단계: 고정밀도(GPS) — 위치가 도착하면 저정밀도를 덮어씀
    this.highAccWatchId = navigator.geolocation.watchPosition(
      handleSuccess,
      (err) => {
        // 권한 거부만 치명적 에러로 처리 — TIMEOUT/UNAVAILABLE은 저정밀도가 커버
        if (err.code === err.PERMISSION_DENIED) {
          onError(new AppError(ErrorCode.GPS_DENIED));
        }
      },
      { enableHighAccuracy: true, maximumAge: GEO_MAXIMUM_AGE_MS, timeout: GEO_TIMEOUT_MS },
    );
  }

  stopTracking() {
    if (this.highAccWatchId !== null) {
      navigator.geolocation.clearWatch(this.highAccWatchId);
      this.highAccWatchId = null;
    }
    if (this.lowAccWatchId !== null) {
      navigator.geolocation.clearWatch(this.lowAccWatchId);
      this.lowAccWatchId = null;
    }
  }
}
