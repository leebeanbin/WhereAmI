import { IPublicTransportAdapter, TransportSchedule, StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';
import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode } from '../../constants/ResponseCodes';
import {
  DEFAULT_CITY_CODE,
  TAGO_ARRIVAL_PAGE_SIZE,
  TAGO_STATION_PAGE_SIZE,
  TAGO_BUS_ARRIVAL_BASE_URL,
  TAGO_BUS_STATION_BASE_URL,
  TAGO_UNKNOWN_VEHICLE,
  TAGO_UNKNOWN_STOP,
} from '../../constants/api';

export class TagoApiAdapter implements IPublicTransportAdapter {
  constructor(private readonly apiKey: string) {}

  async getArrivalInfo(stationId: string, cityCode: string = DEFAULT_CITY_CODE): Promise<TransportSchedule[]> {
    if (!this.apiKey) {
      throw new AppError(ErrorCode.API_UNAUTHORIZED, 'TAGO API 키가 설정되지 않았습니다.');
    }

    try {
      const url = `${TAGO_BUS_ARRIVAL_BASE_URL}/getSttnAcctoArvlPrearngeInfoList?serviceKey=${this.apiKey}&cityCode=${cityCode}&nodeId=${stationId}&numOfRows=${TAGO_ARRIVAL_PAGE_SIZE}&pageNo=1&_type=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new AppError(ErrorCode.API_TIMEOUT, '공공데이터 포털 서버 응답 오류');
      }

      const data = await response.json();
      const items = data?.response?.body?.items?.item;
      if (!items) return [];

      const itemArray = Array.isArray(items) ? items : [items];
      return itemArray.map((item: any) => ({
        vehicleId: item.vehicleno || TAGO_UNKNOWN_VEHICLE,
        lineNo: item.routeno,
        estimatedArrivalTime: new Date(Date.now() + item.arrtime * 1000),
        currentStop: item.nodenm || TAGO_UNKNOWN_STOP,
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
      const url = `${TAGO_BUS_STATION_BASE_URL}/getCrdntPrxmtSttnList?serviceKey=${this.apiKey}&gpsLati=${lat}&gpsLong=${lng}&numOfRows=${TAGO_STATION_PAGE_SIZE}&pageNo=1&_type=json`;
      const response = await fetch(url);

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
