import { AppError } from '../../domain/exceptions/AppError';
import { ErrorCode, ErrorMessages } from '../../constants/ResponseCodes';
import { useLocationStore } from '../../store/useLocationStore';

export class GlobalExceptionHandler {
  static handle(error: unknown) {
    let message = ErrorMessages[ErrorCode.UNKNOWN_ERROR];

    if (error instanceof AppError) {
      message = ErrorMessages[error.code] || error.message;
      console.error(`[AppError: ${error.code}]`, message);
    } else if (error instanceof Error) {
      message = error.message;
      console.error(`[NativeError]`, error);
    } else {
      console.error(`[UnknownError]`, error);
    }

    useLocationStore.getState().setToast({ message, type: 'error' });
  }
}
