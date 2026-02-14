/**
 * Toast Component
 * Toast notification using Snackbar
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { colors, spacing } from '../../styles/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

let toastId = 0;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);

  const showError = useCallback(
    (message: string) => showToast(message, 'error', 4000),
    [showToast]
  );

  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);

  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const currentToast = toasts[0];

  const getBackgroundColor = (type: ToastType): string => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.gray800;
    }
  };

  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {currentToast && (
        <Snackbar
          visible={true}
          onDismiss={() => dismissToast(currentToast.id)}
          duration={currentToast.duration}
          style={[styles.snackbar, { backgroundColor: getBackgroundColor(currentToast.type) }]}
          action={{
            label: 'Dismiss',
            onPress: () => dismissToast(currentToast.id),
            textColor: colors.white,
          }}
        >
          {currentToast.message}
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
}

// Simple toast function for use without context
export function Toast({
  visible,
  message,
  type = 'info',
  onDismiss,
  duration = 3000,
}: {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}) {
  const getBackgroundColor = (toastType: ToastType): string => {
    switch (toastType) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.gray800;
    }
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={[styles.snackbar, { backgroundColor: getBackgroundColor(type) }]}
      action={{
        label: 'Dismiss',
        onPress: onDismiss,
        textColor: colors.white,
      }}
    >
      {message}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: spacing.lg,
    marginHorizontal: spacing.base,
  },
});

export default Toast;
