/** 카카오 지도 기본 확대 레벨 (숫자가 작을수록 더 확대). */
export const MAP_ZOOM_LEVEL = 3;

/** 정류장 마커 이미지 크기 (px). */
export const STATION_MARKER_SIZE = 36;

/** 현재 위치(플레이어) 마커 이미지 크기 (px). */
export const PLAYER_MARKER_SIZE = 48;

/** 이동 경로 Polyline 두께 (px). */
export const ROUTE_STROKE_WEIGHT = 6;

/** 이동 경로 Polyline 불투명도 (0~1). */
export const ROUTE_STROKE_OPACITY = 0.8;

/** 이동 수단별 Polyline 색상. */
export const ROUTE_COLORS = {
  walk: '#00FF00',
  bus: '#0000FF',
  train: '#FF0000',
} as const;
