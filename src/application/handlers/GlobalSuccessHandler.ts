import { SuccessCode, SuccessMessages } from '../../constants/ResponseCodes';

export class GlobalSuccessHandler {
  /**
   * 전역 성공 메시지 인터셉터
   */
  static handle(code: SuccessCode) {
    const message = SuccessMessages[code];
    console.log(`[Success: ${code}]`, message);
    
    // TODO: 이후 Zustand Toast 등 픽셀 UI로 대체 예정
    alert(`[성공]\n${message}`);
  }
}
