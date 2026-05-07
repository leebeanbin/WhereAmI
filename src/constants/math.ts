/** 하버사인 공식에 사용되는 지구 평균 반지름 (km). */
export const EARTH_RADIUS_KM = 6371;

/** 도(°)를 라디안으로 변환하는 계수. */
export const DEG_TO_RAD = Math.PI / 180;

/** 1km = 몇 미터. */
export const METERS_PER_KM = 1000;

/** 1분 = 몇 초. */
export const SECONDS_PER_MINUTE = 60;

/** 1초 = 몇 밀리초. */
export const MS_PER_SECOND = 1000;

/** 1분 = 몇 밀리초. */
export const MS_PER_MINUTE = 60_000;

/** 1시간 = 몇 밀리초. */
export const MS_PER_HOUR = 3_600_000;

/** 이전 위치가 없을 때 사용하는 초기 거리 센티널 값 (km). 어떤 임계값보다도 크게 설정해 첫 번째 fetch를 항상 실행시킴. */
export const FORCE_REFETCH_SENTINEL_KM = 999;

/** 소수점 반올림에 사용하는 100배 계수 (x * 100 / 100 패턴). */
export const DECIMAL_2_FACTOR = 100;
