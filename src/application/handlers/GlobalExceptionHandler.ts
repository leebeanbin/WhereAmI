import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode, ErrorMessages } from '../../constants/ResponseCodes';

export class GlobalExceptionHandler {
  /**
   * @ControllerAdvice 역할을 하는 전역 에러 인터셉터
   */
  static handle(error: unknown) {
    let message = ErrorMessages[ErrorCode.UNKNOWN_ERROR];

    if (error instanceof AppError) {
      // 우리가 정의한 Custom AppError인 경우 Enum 매핑 메시지 표출
      message = ErrorMessages[error.code] || error.message;
      console.error(`[AppError: ${error.code}]`, message);
    } else if (error instanceof Error) {
      // 예상치 못한 런타임 에러 또는 네이티브 에러
      message = error.message;
      console.error(`[NativeError]`, error);
    } else {
      console.error(`[UnknownError]`, error);
    }

    // TODO: 이후 Zustand Toast 등 픽셀 UI로 대체 예정
    alert(`[에러]\n${message}`);
  }
}
