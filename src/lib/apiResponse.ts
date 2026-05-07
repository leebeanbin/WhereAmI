import { NextResponse } from 'next/server';
import { ErrorCode, ErrorMessages } from '@/constants/ResponseCodes';

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ApiResponse = {
  ok<T>(data: T) {
    return NextResponse.json<ApiSuccessBody<T>>({ success: true, data }, { status: HTTP.OK });
  },

  badRequest(code: ErrorCode = ErrorCode.UNKNOWN_ERROR, overrideMessage?: string) {
    return NextResponse.json<ApiErrorBody>(
      { success: false, error: { code, message: overrideMessage ?? ErrorMessages[code] } },
      { status: HTTP.BAD_REQUEST }
    );
  },

  serverError(code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, overrideMessage?: string) {
    return NextResponse.json<ApiErrorBody>(
      { success: false, error: { code, message: overrideMessage ?? ErrorMessages[code] } },
      { status: HTTP.INTERNAL_SERVER_ERROR }
    );
  },

  notFound(code: ErrorCode = ErrorCode.NOT_FOUND, overrideMessage?: string) {
    return NextResponse.json<ApiErrorBody>(
      { success: false, error: { code, message: overrideMessage ?? ErrorMessages[code] } },
      { status: HTTP.NOT_FOUND }
    );
  },
} as const;
