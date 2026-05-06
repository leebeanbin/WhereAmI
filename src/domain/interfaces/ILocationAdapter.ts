export interface ILocationAdapter {
  startTracking(onUpdate: (data: {lat: number, lng: number, time: number}) => void, onError: (error: Error) => void): void;
  stopTracking(): void;
}
