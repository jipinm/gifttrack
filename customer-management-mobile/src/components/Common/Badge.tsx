/**
 * Badge Component
 * Status badges with variants and modern styling
 */
import React from 'react';
import { StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary' | 'accent';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  elevated?: boolean;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'medium',
  icon,
  style,
  textStyle,
  elevated = false,
}: BadgeProps) {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.successLight;
      case 'error':
        return colors.errorLight;
      case 'warning':
        return colors.warningLight;
      case 'info':
        return colors.infoLight;
      case 'primary':
        return colors.primaryLight;
      case 'accent':
        return colors.accentLight;
      case 'default':
      default:
        return colors.gray200;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return '#B8860B'; // Dark goldenrod for better contrast
      case 'info':
        return colors.info;
      case 'primary':
        return colors.primary;
      case 'accent':
        return colors.accent;
      case 'default':
      default:
        return colors.textSecondary;
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
          },
          text: {
            fontSize: typography.fontSize.xs,
          },
        };
      case 'large':
        return {
          container: {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
          text: {
            fontSize: typography.fontSize.base,
          },
        };
      case 'medium':
      default:
        return {
          container: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
          text: {
            fontSize: typography.fontSize.sm,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBackgroundColor() },
        sizeStyles.container,
        elevated && shadows.xs,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: getTextColor() }, sizeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

// Preset badge components for common use cases
export function GiftedBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="success" size="small" style={style} elevated>
      ✓ Gifted
    </Badge>
  );
}

export function NonGiftedBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="default" size="small" style={style}>
      Not Gifted
    </Badge>
  );
}

export function AdminBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="primary" size="small" style={style} elevated>
      Admin
    </Badge>
  );
}

export function SuperadminBadge({ style }: { style?: ViewStyle }) {
  return (
    <Badge variant="accent" size="small" style={style} elevated>
      Superadmin
    </Badge>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  text: {
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
