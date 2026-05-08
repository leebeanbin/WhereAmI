/** TAGO API가 위치 정보를 모를 때 사용하는 기본 도시 코드 (대전광역시). */
export const DEFAULT_CITY_CODE = '25';

/** Kakao 역지오코딩 결과가 없을 때 사용하는 기본 행정구역 이름. */
export const DEFAULT_REGION_NAME = '대전광역시';

/** Firebase에 저장할 익명 사용자 ID. 추후 Firebase Auth 연동 시 교체. */
export const DEFAULT_USER_ID = 'anonymous';

/** 여정 목록을 한 번에 불러올 최대 개수. */
export const JOURNEYS_FETCH_LIMIT = 20;

/** TAGO 버스 도착 정보 조회 시 한 번에 가져올 항목 수. */
export const TAGO_ARRIVAL_PAGE_SIZE = 10;

/** TAGO 주변 정류장 조회 시 한 번에 가져올 항목 수. */
export const TAGO_STATION_PAGE_SIZE = 20;

/** TourAPI 관광 정보 조회 시 한 번에 가져올 항목 수. */
export const TOURISM_PAGE_SIZE = 10;

/** TourAPI 모바일 앱 구분 코드. */
export const TOURISM_MOBILE_OS = 'ETC';

/** TourAPI 모바일 앱 이름. */
export const TOURISM_APP_NAME = 'WhereAmI';

/** TAGO 열차 시간표 조회 시 한 번에 가져올 항목 수. */
export const TRAIN_PAGE_SIZE = 10;

/** 서울 지하철 실시간 도착 조회 시 한 번에 가져올 항목 수. */
export const SUBWAY_PAGE_SIZE = 10;

/** 서울 교통 공사 API: 해당 역에 열차 정보 없음을 나타내는 응답 코드. */
export const SEOUL_METRO_NO_DATA_CODE = 'INFO-200';

/** GeolocationAdapter GPS 캐시 유지 시간 (ms). */
export const GEO_MAXIMUM_AGE_MS = 5000;

/** GeolocationAdapter GPS 응답 타임아웃 (ms). */
export const GEO_TIMEOUT_MS = 5000;

/** 토스트 메시지 자동 닫힘 시간 (ms). */
export const TOAST_DISMISS_MS = 3500;

// ─── External API Base URLs ───────────────────────────────────────────────────

/** TAGO 버스 실시간 도착 정보 서비스 기본 URL. */
export const TAGO_BUS_ARRIVAL_BASE_URL = 'http://apis.data.go.kr/1613000/ArvlInfoInqireService';

/** TAGO 버스 정류장 조회 서비스 기본 URL. */
export const TAGO_BUS_STATION_BASE_URL = 'http://apis.data.go.kr/1613000/BusSttnInfoInqireService';

/** TAGO 열차 정보 서비스 기본 URL. */
export const TAGO_TRAIN_BASE_URL = 'http://apis.data.go.kr/1613000/TrainInfoService';

/** 한국관광공사 국문 관광정보 서비스 기본 URL. */
export const TOUR_API_BASE_URL = 'http://apis.data.go.kr/B551011/KorService1';

/** TAGO 버스 도착 정보: 차량 번호를 알 수 없을 때 사용하는 기본 문자열. */
export const TAGO_UNKNOWN_VEHICLE = '차량번호 미상';

/** TAGO 버스 도착 정보: 정류소 이름을 알 수 없을 때 사용하는 기본 문자열. */
export const TAGO_UNKNOWN_STOP = '알 수 없음';

/** Kakao 로컬 API: 좌표 → 행정구역 변환 URL. */
export const KAKAO_LOCAL_API_URL = 'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json';

/** Kakao 로컬 API: 키워드 기반 장소 검색 URL. */
export const KAKAO_KEYWORD_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

/** Kakao 지하철역 검색 반경 (미터). */
export const SUBWAY_SEARCH_RADIUS_M = 1000;

/** 서울 교통 공사 실시간 지하철 도착 정보 API 기본 URL. */
export const SEOUL_METRO_API_URL = 'http://swopenAPI.seoul.go.kr/api/subway';
