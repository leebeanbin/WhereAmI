// BFF 라우트별 요청 파라미터를 타입으로 명시.
// 각 라우트는 RequestParser로 이 DTO를 생성한 뒤 로직을 실행한다.

export interface LatLngRequestDto {
  lat: number;
  lng: number;
}

export interface TourismRequestDto extends LatLngRequestDto {
  radius: number;
}

export interface TransportRequestDto {
  stationId: string;
  cityCode: string;
}

export interface SubwayRequestDto {
  stationName: string;
}

export interface TrainRequestDto {
  depStationName: string;
  arrStationName: string;
  depPlandTime: string;
}

export interface HistoryStatsRequestDto {
  userId: string;
}
