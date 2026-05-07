/**
 * Cross-platform shared code boundary.
 *
 * Everything exported here:
 *   - Does NOT depend on browser APIs (window, document, navigator)
 *   - Can be used equally from React Native / Node.js / Swift (via BFF)
 *
 * Web-only code (components/, platform/web/) is NOT exported here.
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

// Application — facades
export { useTrackingFacade } from '../application/facades/useTrackingFacade';

// Application — queries
export { fetchJourneys, fetchJourneyByShareId } from '../application/queries/fetchJourneys';

// Application — error handling
export { GlobalExceptionHandler } from '../application/handlers/GlobalExceptionHandler';
export { GlobalSuccessHandler } from '../application/handlers/GlobalSuccessHandler';

// Constants
export { ErrorCode, SuccessCode } from '../constants/ResponseCodes';
export { DEFAULT_USER_ID, DEFAULT_CITY_CODE, JOURNEYS_FETCH_LIMIT } from '../constants/api';

// Store (Zustand — works in React Native)
export { useLocationStore } from '../store/useLocationStore';

// Platform contract
export type { PlatformConfig } from '../platform/types';
