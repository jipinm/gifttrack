/**
 * Customer Card Component
 * Displays customer preview in list view
 * Enhanced with animations and modern styling
 */
import React, { memo, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { Customer } from '../../types';

interface CustomerCardProps {
  customer: Customer;
  onPress: (customer: Customer) => void;
}

function CustomerCard({ customer, onPress }: CustomerCardProps) {
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

  const formatMobile = (mobile: string | undefined): string => {
    if (!mobile) return '';
    if (mobile.length === 10) {
      return `${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  const hasGifts = customer.giftCount !== undefined && customer.giftCount > 0;

  return (
    <Pressable
      onPress={() => onPress(customer)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.card}>
          {/* Accent bar on left side for customers with gifts */}
          {hasGifts && <View style={styles.accentBar} />}

          <View style={styles.content}>
            {/* Header: Name and Event Count */}
            <View style={styles.header}>
              <View style={styles.nameContainer}>
                <Text style={styles.name} numberOfLines={1}>
                  {customer.name}
                </Text>
              </View>
              {customer.eventCount !== undefined && customer.eventCount > 0 && (
                <View style={[styles.badge, styles.eventBadge]}>
                  <Text style={[styles.badgeText, styles.eventText]}>
                    {customer.eventCount} event{customer.eventCount > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Mobile Number */}
            {customer.mobileNumber ? (
            <View style={styles.row}>
              <Text style={styles.icon}>📱</Text>
              <Text style={styles.value}>{formatMobile(customer.mobileNumber)}</Text>
            </View>
            ) : null}

            {/* Location */}
            <View style={styles.row}>
              <Text style={styles.icon}>📍</Text>
              <Text style={styles.value} numberOfLines={1}>
                {customer.city.name}, {customer.district.name}
              </Text>
            </View>

            {/* Gift Summary (if any) */}
            {customer.giftCount !== undefined && customer.giftCount > 0 && (
              <View style={styles.giftSummary}>
                <View style={styles.giftIconContainer}>
                  <Text style={styles.giftIcon}>🎁</Text>
                </View>
                <Text style={styles.giftText}>
                  {customer.giftCount} gift{customer.giftCount > 1 ? 's' : ''} • ₹
                  {customer.totalGiftValue?.toLocaleString('en-IN') ?? 0}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default memo(CustomerCard);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.sm,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.success,
  },
  content: {
    padding: spacing.base,
    paddingLeft: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as '600',
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  giftedBadge: {
    backgroundColor: colors.successLight,
  },
  eventBadge: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium as '500',
  },
  giftedText: {
    color: colors.success,
  },
  eventText: {
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  value: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  giftSummary: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  giftIcon: {
    fontSize: 14,
  },
  giftText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium as '500',
  },
});
