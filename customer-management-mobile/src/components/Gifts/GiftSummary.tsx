/**
 * Gift Summary Component
 * Displays total gift count and value
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../styles/theme';

interface GiftSummaryProps {
  count: number;
  totalValue: number;
}

function GiftSummary({ count, totalValue }: GiftSummaryProps) {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        {/* Gift Count */}
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{count}</Text>
          <Text style={styles.statLabel}>{count === 1 ? 'Gift' : 'Gifts'}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Total Value */}
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.valueText]}>{formatCurrency(totalValue)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  valueText: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.white,
    opacity: 0.3,
    marginHorizontal: spacing.md,
  },
});

export default memo(GiftSummary);
