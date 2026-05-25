/** 카카오 지도 기본 확대 레벨 (숫자가 작을수록 더 확대). */
export const MAP_ZOOM_LEVEL = 3;

/**
 * 카카오 지도 줌 레벨별 정류장 검색 반경 (미터).
 * 레벨 3 기준 스케일바 실측: 46px ≈ 50m → 화면 대각 반경 ≈ 400m.
 * 각 레벨은 2배 스케일 변화.
 */
export const ZOOM_TO_STATION_RADIUS_M: Record<number, number> = {
  1: 100,
  2: 200,
  3: 400,
  4: 800,
  5: 1500,
  6: 3000,
  7: 5000,
  8: 5000,
};

/** 줌 레벨로부터 정류장 검색 반경을 계산 (최대 5000m). */
export function zoomToStationRadius(level: number): number {
  return ZOOM_TO_STATION_RADIUS_M[Math.min(Math.max(level, 1), 8)] ?? 5000;
}

/** 정류장 마커 이미지 크기 (px). */
export const STATION_MARKER_SIZE = 36;

/** 현재 위치(플레이어) 마커 이미지 크기 (px). */
export const PLAYER_MARKER_SIZE = 48;

/** 이동 경로 Polyline 두께 (px). */
export const ROUTE_STROKE_WEIGHT = 8;

/** 이동 경로 Polyline 불투명도 (0~1). */
export const ROUTE_STROKE_OPACITY = 0.92;

/** 이동 수단별 Polyline 색상 (앱 레트로 테마 팔레트). */
export const ROUTE_COLORS = {
  walk: '#2d6a4f',   // retro-green — 도보
  bus: '#b07d30',    // retro-wood  — 버스
  train: '#e63946',  // retro-red   — 기차/지하철
} as const;
