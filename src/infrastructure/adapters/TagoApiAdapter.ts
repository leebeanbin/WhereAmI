import { IPublicTransportAdapter, TransportSchedule, StationInfo } from '../../domain/interfaces/IPublicTransportAdapter';
import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode } from '../../constants/ResponseCodes';

export class TagoApiAdapter implements IPublicTransportAdapter {
  private apiKey: string;
  private baseUrl = 'http://apis.data.go.kr/1613000/ArvlInfoInqireService';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getArrivalInfo(stationId: string, cityCode: string = '25'): Promise<TransportSchedule[]> {
    if (!this.apiKey) {
      throw new AppError(ErrorCode.API_UNAUTHORIZED, 'TAGO API 키가 설정되지 않았습니다.');
    }

    try {
      // 국토교통부 버스도착정보 API 호출 (JSON 포맷 요청)
      // 주의: Decoding된 서비스 키를 사용하거나, fetch 내에서 URL 인코딩 처리를 주의해야 합니다.
      const url = `${this.baseUrl}/getSttnAcctoArvlPrearngeInfoList?serviceKey=${this.apiKey}&cityCode=${cityCode}&nodeId=${stationId}&numOfRows=10&pageNo=1&_type=json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new AppError(ErrorCode.API_TIMEOUT, '공공데이터 포털 서버 응답 오류');
      }

      const data = await response.json();
      
      // 데이터 구조 방어 코드
      const items = data?.response?.body?.items?.item;
      if (!items) {
          return []; // 도착 예정 정보 없음
      }

      // items가 단일 객체일 수 있으므로 배열로 정규화
      const itemArray = Array.isArray(items) ? items : [items];

      return itemArray.map((item: any) => ({
        vehicleId: item.vehicleno || '차량번호 미상',
        lineNo: item.routeno,
        estimatedArrivalTime: new Date(Date.now() + (item.arrtime * 1000)), // arrtime은 초 단위 남은 시간
        currentStop: item.nodenm || '알 수 없음'
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
      // 국토교통부 버스정류소정보 - 좌표기반 주변 정류장 목록 조회
      const sttnUrl = `http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${this.apiKey}&gpsLati=${lat}&gpsLong=${lng}&numOfRows=20&pageNo=1&_type=json`;
      
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
      }));

    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[TagoApiAdapter Error]', error);
      throw new AppError(ErrorCode.NETWORK_ERROR, '공공데이터 포털과 통신 중 오류가 발생했습니다.');
    }
  }
}
