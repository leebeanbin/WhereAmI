/** EMA(지수 이동 평균) 스무딩 계수. 0에 가까울수록 과거 데이터 비중 증가. */
export const EMA_ALPHA = 0.3;

/** 이 속도(km/h) 이상의 GPS 포인트는 오류 데이터로 간주하고 무시. */
export const MAX_OUTLIER_SPEED_KMH = 350;

/** EMA 속도가 이 값 이상이면 버스 모드로 감지. */
export const SPEED_BUS_MIN_KMH = 12;

/** EMA 속도가 이 값 이상이면 기차/지하철 모드로 감지. */
export const SPEED_TRAIN_MIN_KMH = 60;

/** 이 거리(km) 이동 시마다 주변 정류장을 재조회. */
export const STATION_REFETCH_DISTANCE_KM = 0.5;

/** 이 거리(km) 이상 이동 시 도시 코드(cityCode)를 재조회. */
export const CITY_CODE_REFRESH_DISTANCE_KM = 10;

/** 이 거리(km) 이동 시마다 주변 관광 정보를 조회. */
export const TOURISM_FETCH_DISTANCE_KM = 2;

/** 관광 정보 조회 반경 (미터). */
export const TOURISM_RADIUS_M = 2000;
