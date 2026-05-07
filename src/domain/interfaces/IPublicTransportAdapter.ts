export interface TransportSchedule {
  vehicleId: string;
  lineNo: string;
  estimatedArrivalTime: Date;
  currentStop: string;
}

export interface StationInfo {
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
  distance?: number;
  type?: 'bus' | 'subway';
}

/**
 * 공공데이터포털(TAGO) API 등 버스/열차 도착 정보 제공자를 위한 어댑터 인터페이스
 */
export interface IPublicTransportAdapter {
  getArrivalInfo(stationId: string, cityCode?: string): Promise<TransportSchedule[]>;
  getNearbyStations(lat: number, lng: number): Promise<StationInfo[]>;
}
