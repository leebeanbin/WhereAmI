import { SuccessCode, SuccessMessages } from '../../constants/ResponseCodes';
import { useLocationStore } from '../../store/useLocationStore';

export class GlobalSuccessHandler {
  static handle(code: SuccessCode) {
    const message = SuccessMessages[code];
    console.log(`[Success: ${code}]`, message);

    useLocationStore.getState().setToast({ message, type: 'success' });
  }
}
