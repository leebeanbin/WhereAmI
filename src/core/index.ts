/**
 * 크로스 플랫폼 공유 코드 경계.
 *
 * 이 파일에서 export 되는 모든 것은:
 *   - 브라우저 API (window, document, navigator) 에 의존하지 않음
 *   - React Native / Node.js / Swift(BFF 호출)에서 동일하게 사용 가능
 *
 * Web-only 코드 (components/, platform/web/) 는 여기서 export 하지 않는다.
 */

// Domain
export type { TransportMode, RoutePoint, Journey } from '../domain/models/Journey';
export type { ILocationAdapter } from '../domain/interfaces/ILocationAdapter';
export type { IPublicTransportAdapter, StationInfo, TransportSchedule } from '../domain/interfaces/IPublicTransportAdapter';
export type { IJourneyRepository } from '../domain/interfaces/IJourneyRepository';
export { AppError } from '../domain/exceptions/AppError';

// Application — utils
export { getDistanceFromLatLonInKm, formatDistance, formatDuration } from '../application/utils/geoUtils';
export { mapRegionToCityCode } from '../application/utils/cityCodeMapper';
export { TransportIconFactory } from '../application/factories/TransportIconFactory';

// Application — error handling
export { GlobalExceptionHandler } from '../application/handlers/GlobalExceptionHandler';
export { GlobalSuccessHandler } from '../application/handlers/GlobalSuccessHandler';

// Constants
export { ErrorCode, SuccessCode } from '../constants/ResponseCodes';

// Store (Zustand — works in React Native)
export { useLocationStore } from '../store/useLocationStore';

// Infrastructure — adapters (platform-agnostic ones only)
export { TagoApiAdapter } from '../infrastructure/adapters/TagoApiAdapter';
export { FirebaseJourneyRepository } from '../infrastructure/repositories/FirebaseJourneyRepository';

// Platform contract
export type { PlatformConfig } from '../platform/types';
