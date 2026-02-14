/**
 * Button Component
 * Reusable button with primary, secondary, danger, and outline variants
 * Enhanced with animations and modern styling
 */
import React, { useRef } from 'react';
import { StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'text' | 'success';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
  compact?: boolean;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  labelStyle,
  fullWidth = false,
  compact = false,
}: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const getButtonMode = (): 'contained' | 'outlined' | 'text' => {
    switch (variant) {
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getButtonColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.error;
      case 'success':
        return colors.success;
      case 'outline':
        return colors.primary;
      case 'text':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (variant === 'outline' || variant === 'text') {
      return getButtonColor();
    }
    return colors.white;
  };

  const getShadowStyle = () => {
    if (variant === 'outline' || variant === 'text' || disabled) {
      return {};
    }
    switch (variant) {
      case 'primary':
        return shadows.glow;
      case 'success':
        return shadows.glowSuccess;
      default:
        return shadows.md;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <PaperButton
        mode={getButtonMode()}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        loading={loading}
        disabled={disabled || loading}
        icon={icon}
        buttonColor={getButtonColor()}
        textColor={getTextColor()}
        compact={compact}
        style={[
          styles.button,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          getShadowStyle(),
          style,
        ]}
        labelStyle={[styles.label, labelStyle]}
        contentStyle={styles.content}
      >
        {children}
      </PaperButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    height: 52,
    paddingHorizontal: spacing.lg,
  },
});
