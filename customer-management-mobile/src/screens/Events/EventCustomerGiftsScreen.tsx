/**
 * Event Customer Gifts Screen
 * Shows all gifts for a specific customer in a specific event.
 * Allows adding, editing and deleting gifts.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  FAB,
  ActivityIndicator,
  IconButton,
  Dialog,
  Portal,
  Button,
  Divider,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { giftService } from '../../services/giftService';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Gift } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventCustomerGifts'>;
type RoutePropType = RouteProp<EventStackParamList, 'EventCustomerGifts'>;

export default function EventCustomerGiftsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId, customerId, customerName, eventCategory } = route.params;

  const direction = eventCategory === 'self_event' ? 'received' : 'given';

  // State
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gift | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load gifts
  const loadGifts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await giftService.getEventCustomerGifts(eventId, customerId);

      if (response.success && response.data) {
        const data = response.data as any;
        const giftList = Array.isArray(data.gifts) ? data.gifts : [];
        setGifts(giftList);
        setTotalValue(data.totalValue ?? 0);
      } else {
        setError(response.message || 'Failed to load gifts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, customerId]);

  useFocusEffect(
    useCallback(() => {
      loadGifts();
    }, [loadGifts])
  );

  // Format currency
  const formatCurrency = (value?: number): string => {
    return `₹${(value ?? 0).toLocaleString('en-IN')}`;
  };

  // Delete gift
  const handleDeleteGift = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const response = await giftService.deleteGift(deleteTarget.id);

      if (response.success) {
        setDeleteTarget(null);
        loadGifts();
      } else {
        setDeleteTarget(null);
        Alert.alert('Error', response.message || 'Failed to delete gift');
      }
    } catch (err) {
      setDeleteTarget(null);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete gift');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadGifts]);

  // Navigate to add gift
  const handleAddGift = useCallback(() => {
    navigation.navigate('CreateGift', { eventId, customerId });
  }, [navigation, eventId, customerId]);

  // Navigate to edit gift
  const handleEditGift = useCallback(
    (giftId: string) => {
      navigation.navigate('EditGift', { giftId, customerId });
    },
    [navigation, customerId]
  );

  // Render gift item
  const renderGiftItem = useCallback(
    ({ item }: { item: Gift }) => (
      <View style={styles.giftCard}>
        <View style={styles.giftCardHeader}>
          <View style={styles.giftTypeContainer}>
            <Text style={styles.giftTypeName}>
              {item.giftType?.name || 'Unknown Type'}
            </Text>
            <Chip
              style={[
                styles.directionChip,
                direction === 'received'
                  ? styles.receivedChip
                  : styles.givenChip,
              ]}
              textStyle={styles.directionChipText}
              compact
            >
              {direction === 'received' ? '📥 Received' : '📤 Given'}
            </Chip>
          </View>
          <View style={styles.giftActions}>
            <IconButton
              icon="pencil"
              size={18}
              iconColor={colors.primary}
              onPress={() => handleEditGift(item.id)}
              style={styles.actionBtn}
            />
            <IconButton
              icon="delete"
              size={18}
              iconColor={colors.error}
              onPress={() => setDeleteTarget(item)}
              style={styles.actionBtn}
            />
          </View>
        </View>

        <Text style={styles.giftValue}>{formatCurrency(item.value)}</Text>

        {item.description ? (
          <Text style={styles.giftDescription}>{item.description}</Text>
        ) : null}
      </View>
    ),
    [direction, handleEditGift]
  );

  // Loading
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading gifts...</Text>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="outlined" onPress={loadGifts}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Customer + Summary Header */}
      <View style={styles.headerCard}>
        <Text style={styles.customerNameHeader}>{customerName}</Text>
        <Divider style={styles.divider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{gifts.length}</Text>
            <Text style={styles.summaryLabel}>
              Gift{gifts.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.valueHighlight]}>
              {formatCurrency(totalValue)}
            </Text>
            <Text style={styles.summaryLabel}>Total Value</Text>
          </View>
        </View>
      </View>

      {/* Gifts List */}
      {gifts.length > 0 ? (
        <FlatList
          data={gifts}
          keyExtractor={(item) => item.id}
          renderItem={renderGiftItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyText}>No gifts yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to add a gift
          </Text>
        </View>
      )}

      {/* FAB to add gift */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddGift}
        color={colors.white}
      />

      {/* Delete Dialog */}
      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Gift</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this{' '}
              {deleteTarget?.giftType?.name || 'gift'} worth{' '}
              {formatCurrency(deleteTarget?.value)}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onPress={handleDeleteGift}
              loading={isDeleting}
              textColor={colors.error}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  headerCard: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  customerNameHeader: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  valueHighlight: {
    color: colors.success,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  giftCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  giftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  giftTypeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  giftTypeName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  directionChip: {
    height: 24,
  },
  receivedChip: {
    backgroundColor: '#E8F5E9',
  },
  givenChip: {
    backgroundColor: '#E3F2FD',
  },
  directionChipText: {
    fontSize: 10,
    lineHeight: 12,
  },
  giftActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    margin: 0,
  },
  giftValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.success,
    marginTop: spacing.xs,
  },
  giftDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
