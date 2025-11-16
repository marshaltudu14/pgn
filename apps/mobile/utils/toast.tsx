export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Global toast instance - will be set by the ToastProvider
let globalToastInstance: any = null;

export const setGlobalToastInstance = (instance: any) => {
  globalToastInstance = instance;
};

/**
 * Toast utility that uses the proper Toast component
 * Falls back to console logging if toast provider is not available
 */
export class Toast {
  static show(message: string, type: ToastType = 'info') {
    if (globalToastInstance) {
      switch (type) {
        case 'success':
          globalToastInstance.success(message);
          break;
        case 'error':
          globalToastInstance.error(message);
          break;
        case 'warning':
          globalToastInstance.warning(message);
          break;
        case 'info':
        default:
          globalToastInstance.info(message);
          break;
      }
    }
  }

  static success(message: string, description?: string, duration?: number) {
    if (globalToastInstance) {
      globalToastInstance.success(message, description, duration);
    }
  }

  static error(message: string, description?: string, duration?: number) {
    if (globalToastInstance) {
      globalToastInstance.error(message, description, duration);
    }
  }

  static warning(message: string, description?: string, duration?: number) {
    if (globalToastInstance) {
      globalToastInstance.warning(message, description, duration);
    }
  }

  static info(message: string, description?: string, duration?: number) {
    if (globalToastInstance) {
      globalToastInstance.info(message, description, duration);
    }
  }
}

// Simple wrapper for backward compatibility
export const showToast = {
  success: (message: string, description?: string, duration?: number) => {
    Toast.success(message, description, duration);
  },

  error: (message: string, description?: string, duration?: number) => {
    Toast.error(message, description, duration);
  },

  info: (message: string, description?: string, duration?: number) => {
    Toast.info(message, description, duration);
  },

  warning: (message: string, description?: string, duration?: number) => {
    Toast.warning(message, description, duration);
  },

  hide: () => {
    if (globalToastInstance) {
      globalToastInstance.dismiss();
    }
  },
};


export default Toast;