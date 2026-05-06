import { ErrorCode } from '../../constants/ResponseCodes';

export class AppError extends Error {
  public code: ErrorCode;
  
  constructor(code: ErrorCode, message?: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}
