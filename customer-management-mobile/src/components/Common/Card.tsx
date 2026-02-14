/**
 * Card Component
 * Generic card container with variants including glassmorphism
 * Enhanced with animations and modern styling
 */
import React, { useRef } from 'react';
import { StyleSheet, ViewStyle, Animated, Pressable, View } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../styles/theme';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  animated?: boolean;
}

export default function Card({
  children,
  variant = 'elevated',
  style,
  onPress,
  padding = 'medium',
  animated = true,
}: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress && animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress && animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'medium':
        return spacing.base;
      case 'large':
        return spacing.xl;
      default:
        return spacing.base;
    }
  };

  const content = (
    <View
      style={[
        styles.card,
        variant === 'outlined' && styles.outlined,
        variant === 'filled' && styles.filled,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && shadows.md,
        { padding: getPadding() },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>{content}</Animated.View>
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  outlined: {
    borderColor: colors.border,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  filled: {
    backgroundColor: colors.gray100,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
