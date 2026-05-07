/**
 * [Java Spring Style Enum]
 * 애플리케이션 전역에서 사용되는 에러 코드와 한글 메시지 매핑
 */
export enum ErrorCode {
  // Common
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // GPS
  GPS_DENIED = 'GPS_DENIED',
  GPS_UNAVAILABLE = 'GPS_UNAVAILABLE',
  GPS_TIMEOUT = 'GPS_TIMEOUT',

  // API
  API_TIMEOUT = 'API_TIMEOUT',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * 애플리케이션 전역에서 사용되는 성공 코드와 한글 메시지 매핑
 */
export enum SuccessCode {
  JOURNEY_STARTED = 'JOURNEY_STARTED',
  JOURNEY_SAVED = 'JOURNEY_SAVED',
  BOOKMARK_ADDED = 'BOOKMARK_ADDED',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN_ERROR]: '앗! 알 수 없는 에러가 발생했어요. 💦',
  [ErrorCode.NETWORK_ERROR]: '네트워크 연결이 불안정합니다.',
  [ErrorCode.GPS_DENIED]: '위치 정보 접근 권한이 거부되었습니다.',
  [ErrorCode.GPS_UNAVAILABLE]: '기기에서 위치 정보를 가져올 수 없습니다.',
  [ErrorCode.GPS_TIMEOUT]: '위치 정보를 가져오는데 시간이 초과되었습니다.',
  [ErrorCode.API_TIMEOUT]: '서버 응답 시간이 초과되었습니다.',
  [ErrorCode.API_UNAUTHORIZED]: '인증 정보가 유효하지 않습니다.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '서버 내부 오류가 발생했습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
};

export const SuccessMessages: Record<SuccessCode, string> = {
  [SuccessCode.JOURNEY_STARTED]: '모험이 시작되었습니다! 🚀',
  [SuccessCode.JOURNEY_SAVED]: '모험 기록이 안전하게 저장되었습니다! 💾',
  [SuccessCode.BOOKMARK_ADDED]: '정류장이 즐겨찾기에 추가되었습니다! ⭐',
};
