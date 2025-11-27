import { create } from 'zustand';
import { toast } from 'sonner';

interface UIState {
  loading: Record<string, boolean>;

  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;

  setLoading: (key: string, isLoading: boolean) => void;
  getLoading: (key: string) => boolean;
  clearAllLoading: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  loading: {},

  showNotification: (message, type = 'info') => {
    try {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'info':
        default:
          toast.info(message);
          break;
      }
    } catch (error) {
      // Gracefully handle toast errors to prevent app crashes
      console.error('Toast notification error:', error);
    }
  },

  setLoading: (key, isLoading) => {
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: isLoading,
      },
    }));
  },

  getLoading: (key) => {
    return get().loading[key] || false;
  },

  clearAllLoading: () => {
    set({ loading: {} });
  },
}));