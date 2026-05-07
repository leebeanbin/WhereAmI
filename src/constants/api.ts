/** TAGO API가 위치 정보를 모를 때 사용하는 기본 도시 코드 (대전광역시). */
export const DEFAULT_CITY_CODE = '25';

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

/** TAGO 열차 시간표 조회 시 한 번에 가져올 항목 수. */
export const TRAIN_PAGE_SIZE = 10;

/** 서울 지하철 실시간 도착 조회 시 한 번에 가져올 항목 수. */
export const SUBWAY_PAGE_SIZE = 10;

/** GeolocationAdapter GPS 캐시 유지 시간 (ms). */
export const GEO_MAXIMUM_AGE_MS = 5000;

/** GeolocationAdapter GPS 응답 타임아웃 (ms). */
export const GEO_TIMEOUT_MS = 5000;

/** 토스트 메시지 자동 닫힘 시간 (ms). */
export const TOAST_DISMISS_MS = 3500;
