import { IPublicTransportAdapter, TransportSchedule, StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';
import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode } from '../../constants/ResponseCodes';
import { DEFAULT_CITY_CODE, TAGO_ARRIVAL_PAGE_SIZE, TAGO_STATION_PAGE_SIZE } from '../../constants/api';

export class TagoApiAdapter implements IPublicTransportAdapter {
  private apiKey: string;
  private baseUrl = 'http://apis.data.go.kr/1613000/ArvlInfoInqireService';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getArrivalInfo(stationId: string, cityCode: string = DEFAULT_CITY_CODE): Promise<TransportSchedule[]> {
    if (!this.apiKey) {
      throw new AppError(ErrorCode.API_UNAUTHORIZED, 'TAGO API 키가 설정되지 않았습니다.');
    }

    try {
      const url = `${this.baseUrl}/getSttnAcctoArvlPrearngeInfoList?serviceKey=${this.apiKey}&cityCode=${cityCode}&nodeId=${stationId}&numOfRows=${TAGO_ARRIVAL_PAGE_SIZE}&pageNo=1&_type=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new AppError(ErrorCode.API_TIMEOUT, '공공데이터 포털 서버 응답 오류');
      }

      const data = await response.json();
      const items = data?.response?.body?.items?.item;
      if (!items) return [];

      const itemArray = Array.isArray(items) ? items : [items];

      return itemArray.map((item: any) => ({
        vehicleId: item.vehicleno || '차량번호 미상',
        lineNo: item.routeno,
        // arrtime은 초 단위 남은 시간
        estimatedArrivalTime: new Date(Date.now() + item.arrtime * 1000),
        currentStop: item.nodenm || '알 수 없음',
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[TagoApiAdapter Error]', error);
      throw new AppError(ErrorCode.NETWORK_ERROR, '공공데이터 포털과 통신 중 오류가 발생했습니다.');
    }
  }

  async getNearbyStations(lat: number, lng: number): Promise<StationInfo[]> {
    if (!this.apiKey) {
      throw new AppError(ErrorCode.API_UNAUTHORIZED, 'TAGO API 키가 설정되지 않았습니다.');
    }

    try {
      const sttnUrl = `http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${this.apiKey}&gpsLati=${lat}&gpsLong=${lng}&numOfRows=${TAGO_STATION_PAGE_SIZE}&pageNo=1&_type=json`;
      const response = await fetch(sttnUrl);

      if (!response.ok) {
        throw new AppError(ErrorCode.API_TIMEOUT, '공공데이터 포털 서버 응답 오류');
      }

      const data = await response.json();
      const items = data?.response?.body?.items?.item;
      if (!items) return [];

      const itemArray = Array.isArray(items) ? items : [items];

      return itemArray.map((item: any) => ({
        stationId: item.nodeid,
        stationName: item.nodenm,
        lat: item.gpslati,
        lng: item.gpslong,
        type: 'bus' as const,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[TagoApiAdapter Error]', error);
      throw new AppError(ErrorCode.NETWORK_ERROR, '공공데이터 포털과 통신 중 오류가 발생했습니다.');
    }
  }
}
