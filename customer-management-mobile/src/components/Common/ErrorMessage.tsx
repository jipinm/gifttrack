/**
 * ErrorMessage Component
 * Error display with retry option
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../styles/theme';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'inline' | 'fullScreen' | 'banner';
  style?: ViewStyle;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'inline',
  style,
}: ErrorMessageProps) {
  if (variant === 'banner') {
    return (
      <View style={[styles.banner, style]}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={20}
          color={colors.error}
          style={styles.bannerIcon}
        />
        <Text style={styles.bannerText} numberOfLines={2}>
          {message}
        </Text>
        {onRetry && (
          <Text style={styles.bannerRetry} onPress={onRetry}>
            {retryLabel}
          </Text>
        )}
      </View>
    );
  }

  const containerStyle =
    variant === 'fullScreen' ? styles.fullScreenContainer : styles.inlineContainer;

  return (
    <View style={[containerStyle, style]}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={variant === 'fullScreen' ? 64 : 48}
        color={colors.error}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button variant="outline" onPress={onRetry} style={styles.button}>
          {retryLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  fullScreenContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: {
    marginBottom: spacing.base,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.sm,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.base,
    flexDirection: 'row',
    padding: spacing.md,
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  bannerText: {
    color: colors.error,
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  bannerRetry: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
});
