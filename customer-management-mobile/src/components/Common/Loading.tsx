/**
 * Loading Component
 * Loading spinner and skeleton variants with enhanced animations
 */
import React from 'react';
import { StyleSheet, View, ViewStyle, Animated, DimensionValue } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({
  size = 'large',
  color = colors.primary,
  message,
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const content = (
    <View style={[styles.spinnerContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: customBorderRadius = borderRadius.base,
  style,
}: SkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customBorderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ lines = 3, style }: SkeletonCardProps) {
  return (
    <View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.skeletonHeaderText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={styles.skeletonLine} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={14}
          style={styles.skeletonLine}
        />
      ))}
    </View>
  );
}

// Default export for simple loading spinner
export default function Loading({
  size = 'large',
  message,
}: {
  size?: 'small' | 'large';
  message?: string;
}) {
  return <LoadingSpinner size={size} message={message} fullScreen />;
}

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fullScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  skeleton: {
    backgroundColor: colors.gray300,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.sm,
  },
  skeletonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  skeletonLine: {
    marginTop: spacing.sm,
  },
});
