import React, { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { setGlobalToastInstance } from '@/utils/toast';
import { COLORS } from '@/constants';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  success: (title: string, description?: string, duration?: number) => void;
  error: (title: string, description?: string, duration?: number) => void;
  warning: (title: string, description?: string, duration?: number) => void;
  info: (title: string, description?: string, duration?: number) => void;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const colors = useThemeColors();

  const dismissToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  }, [toast.id, onDismiss, translateY, opacity, scale]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Auto dismiss
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        dismissToast();
      }, toast.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [dismissToast, toast.duration, translateY, opacity, scale]);

  const handlePress = () => {
    dismissToast();
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = getIconColor();

    switch (toast.type) {
      case 'success':
        return <CheckCircle size={iconSize} color={iconColor} />;
      case 'error':
        return <XCircle size={iconSize} color={iconColor} />;
      case 'warning':
        return <AlertCircle size={iconSize} color={iconColor} />;
      case 'info':
      default:
        return <Info size={iconSize} color={iconColor} />;
    }
  };

  const getIconColor = () => {
    switch (toast.type) {
      case 'success':
        return COLORS.SUCCESS; // green-500
      case 'error':
        return COLORS.ERROR; // red-500
      case 'warning':
        return COLORS.WARNING;
      case 'info':
      default:
        return COLORS.INFO; // blue-500
    }
  };

  const getBackgroundColor = () => {
    return colors.listBg;
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return COLORS.SUCCESS;
      case 'error':
        return COLORS.ERROR;
      case 'warning':
        return COLORS.WARNING;
      case 'info':
      default:
        return COLORS.INFO;
    }
  };

  const getTitleColor = () => {
    return colors.text;
  };

  const getDescriptionColor = () => {
    return colors.textSecondary;
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.toastContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderLeftColor: getBorderColor(),
            shadowColor: '#000',
            transform: [
              { translateY },
              { scale },
            ],
            opacity,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: getTitleColor() }]}>
            {toast.title}
          </Text>
          {toast.description && (
            <Text style={[styles.description, { color: getDescriptionColor() }]}>
              {toast.description}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  // Use refs to maintain stable references to avoid infinite loops
  const addToastRef = useRef<(type: ToastType, title: string, description?: string, duration?: number) => void>(
    () => {}
  );
  const dismissToastRef = useRef<(id?: string) => void>(() => {});

  const addToast = useCallback((type: ToastType, title: string, description?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = {
      id,
      type,
      title,
      description,
      duration,
    };

    setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts
  }, []);

  const dismissToast = useCallback((id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  // Update refs when functions change
  addToastRef.current = addToast;
  dismissToastRef.current = dismissToast;

  const contextValue: ToastContextType = useMemo(() => ({
    success: (title, description, duration) => addToast('success', title, description, duration),
    error: (title, description, duration) => addToast('error', title, description, duration),
    warning: (title, description, duration) => addToast('warning', title, description, duration),
    info: (title, description, duration) => addToast('info', title, description, duration),
    dismiss: dismissToast,
  }), [addToast, dismissToast]);

  // Set global toast instance for the Toast utility class once on mount
  useEffect(() => {
    setGlobalToastInstance({
      success: (title: string, description?: string, duration?: number) =>
        addToastRef.current?.('success', title, description, duration),
      error: (title: string, description?: string, duration?: number) =>
        addToastRef.current?.('error', title, description, duration),
      warning: (title: string, description?: string, duration?: number) =>
        addToastRef.current?.('warning', title, description, duration),
      info: (title: string, description?: string, duration?: number) =>
        addToastRef.current?.('info', title, description, duration),
      dismiss: (id?: string) => dismissToastRef.current?.(id),
    });

    return () => {
      setGlobalToastInstance(null);
    };
  }, []); // Empty dependency array - stable refs prevent stale closures

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={[styles.toastWrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: '#1F2937', // gray-800
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 4,
    color: '#6B7280', // gray-500
  },
});