/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { colors, spacing, typography } from '../../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // TODO: Log to error reporting service (e.g., Sentry, Crashlytics)
    // errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.surface}>
            <View style={styles.iconContainer}>
              <Icon source="alert-circle-outline" size={64} color={colors.error} />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              An unexpected error occurred. Please try again or restart the app.
            </Text>

            {__DEV__ && error && (
              <ScrollView style={styles.errorContainer} nestedScrollEnabled>
                <Text style={styles.errorTitle}>Error Details (Dev only):</Text>
                <Text style={styles.errorText}>{error.toString()}</Text>
                {errorInfo?.componentStack && (
                  <Text style={styles.stackTrace}>
                    {errorInfo.componentStack.substring(0, 500)}...
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={this.handleRetry}
                style={styles.button}
                buttonColor={colors.primary}
              >
                Try Again
              </Button>
            </View>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  surface: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray800,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  button: {
    minWidth: 120,
  },
});

export default ErrorBoundary;
