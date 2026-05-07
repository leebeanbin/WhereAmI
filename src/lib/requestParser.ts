/**
 * BFF 라우트에서 URLSearchParams 파싱 책임을 분리하는 유틸리티.
 * 각 메서드는 파싱 실패 시 null / defaultVal을 반환하므로
 * 라우트는 null 체크만 하면 된다.
 */
export class RequestParser {
  constructor(private readonly params: URLSearchParams) {}

  requireString(key: string): string | null {
    const val = this.params.get(key);
    return val !== null && val.trim() !== '' ? val.trim() : null;
  }

  requireNumber(key: string): number | null {
    const val = this.params.get(key);
    if (val === null) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  }

  optionalString(key: string, defaultVal: string): string {
    const val = this.params.get(key);
    return val !== null && val.trim() !== '' ? val.trim() : defaultVal;
  }

  optionalNumber(key: string, defaultVal: number): number {
    const val = this.params.get(key);
    if (val === null) return defaultVal;
    const n = parseFloat(val);
    return isNaN(n) ? defaultVal : n;
  }

  static from(request: Request): RequestParser {
    return new RequestParser(new URL(request.url).searchParams);
  }
}
