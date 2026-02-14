/**
 * Gift List Component
 * Displays a list of gifts for a customer with summary
 */
import React, { memo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import GiftCard from './GiftCard';
import GiftSummary from './GiftSummary';
import { colors, spacing } from '../../styles/theme';
import type { Gift } from '../../types';

interface GiftListProps {
  gifts: Gift[];
  totalValue: number;
  isLoading?: boolean;
  onEditGift?: (gift: Gift) => void;
  onDeleteGift?: (gift: Gift) => void;
  showActions?: boolean;
  ListHeaderComponent?: React.ReactElement;
}

function GiftList({
  gifts,
  totalValue,
  isLoading = false,
  onEditGift,
  onDeleteGift,
  showActions = true,
  ListHeaderComponent,
}: GiftListProps) {
  // Handle delete with confirmation
  const handleDelete = useCallback(
    (gift: Gift) => {
      Alert.alert(
        'Delete Gift',
        `Are you sure you want to delete this ${gift.giftType.name} gift worth ₹${gift.value.toLocaleString('en-IN')}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDeleteGift?.(gift),
          },
        ]
      );
    },
    [onDeleteGift]
  );

  // Render gift item
  const renderGiftItem = useCallback(
    ({ item }: { item: Gift }) => (
      <GiftCard
        gift={item}
        onEdit={onEditGift}
        onDelete={onDeleteGift ? handleDelete : undefined}
        showActions={showActions}
      />
    ),
    [onEditGift, onDeleteGift, handleDelete, showActions]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Gift) => item.id, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading gifts...</Text>
      </View>
    );
  }

  // Empty state
  if (gifts.length === 0) {
    return (
      <View style={styles.container}>
        {ListHeaderComponent}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyTitle}>No Gifts Yet</Text>
          <Text style={styles.emptySubtitle}>Add the first gift for this customer</Text>
        </View>
      </View>
    );
  }

  // Header with summary
  const ListHeader = () => (
    <>
      {ListHeaderComponent}
      <GiftSummary count={gifts.length} totalValue={totalValue} />
      <Text style={styles.listTitle}>Gift History</Text>
    </>
  );

  return (
    <FlatList
      data={gifts}
      renderItem={renderGiftItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={<ListHeader />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});

export default memo(GiftList);
