/**
 * Gift Card Component
 * Displays a single gift with type, value, date, and actions
 * Enhanced with animations and modern styling
 */
import React, { memo, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { Gift } from '../../types';

interface GiftCardProps {
  gift: Gift;
  onEdit?: (gift: Gift) => void;
  onDelete?: (gift: Gift) => void;
  showActions?: boolean;
}

function GiftCard({ gift, onEdit, onDelete, showActions = true }: GiftCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.card}>
          <View style={styles.content}>
            {/* Left accent bar */}
            <View style={styles.accentBar} />

            <View style={styles.mainContent}>
              {/* Gift Type Badge */}
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{gift.giftType.name}</Text>
              </View>

              {/* Gift Value */}
              <Text style={styles.value}>{formatCurrency(gift.value)}</Text>

              {/* Event Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.dateValue}>{formatDate(gift.eventDate)}</Text>
              </View>

              {/* Description */}
              {gift.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {gift.description}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            {showActions && (
              <View style={styles.actions}>
                {onEdit && (
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor={colors.primary}
                    onPress={() => onEdit(gift)}
                    style={styles.actionButton}
                    containerColor={colors.primaryLight}
                  />
                )}
                {onDelete && (
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor={colors.error}
                    onPress={() => onDelete(gift)}
                    style={styles.actionButton}
                    containerColor={colors.errorLight}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.base,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent,
  },
  mainContent: {
    flex: 1,
    paddingLeft: spacing.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  typeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold as '600',
  },
  value: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as '700',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  dateValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'column',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    margin: 0,
    borderRadius: borderRadius.base,
  },
});

export default memo(GiftCard);
