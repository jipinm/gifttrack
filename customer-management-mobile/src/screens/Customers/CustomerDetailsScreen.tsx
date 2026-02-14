/**
 * Customer Details Screen
 * Displays customer information with their gifts
 * Events are now standalone - customer just shows gifts received/given
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { customerService } from '../../services/customerService';
import { giftService } from '../../services/giftService';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Customer, Gift, CustomerGiftsResponse } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerStackNavigator';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList, 'CustomerDetails'>;
type RoutePropType = RouteProp<CustomerStackParamList, 'CustomerDetails'>;

export default function CustomerDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { customerId } = route.params;

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [totalGiftValue, setTotalGiftValue] = useState(0);
  const [giftCount, setGiftCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<Gift | null>(null);

  // Load customer and gifts
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load customer
      const customerResponse = await customerService.getById(customerId);

      if (customerResponse.success && customerResponse.data) {
        setCustomer(customerResponse.data);
      } else {
        setError(customerResponse.message || 'Failed to load customer');
        return;
      }

      // Load gifts
      try {
        const giftsResponse = await giftService.getCustomerGifts(customerId);
        if (giftsResponse.success && giftsResponse.data) {
          const giftData = giftsResponse.data as CustomerGiftsResponse;
          setGifts(giftData.gifts || []);
          setTotalGiftValue(giftData.totalValue || 0);
          setGiftCount(giftData.count || 0);
        } else {
          setGifts([]);
        }
      } catch (giftErr) {
        console.log('Gifts fetch error:', giftErr);
        setGifts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Navigate to edit customer
  const handleEdit = useCallback(() => {
    navigation.navigate('EditCustomer', { customerId });
  }, [navigation, customerId]);

  // Navigate to edit gift
  const handleEditGift = useCallback(
    (giftId: string) => {
      navigation.navigate('EditGift', { giftId, customerId });
    },
    [navigation, customerId]
  );

  // Delete gift
  const handleDeleteGift = useCallback(async () => {
    if (!giftToDelete) return;

    try {
      const response = await giftService.deleteGift(giftToDelete.id);
      if (response.success) {
        setGiftToDelete(null);
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete gift');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete gift');
    }
  }, [giftToDelete, loadData]);

  // Call customer
  const handleCall = useCallback(() => {
    if (customer) {
      Linking.openURL(`tel:${customer.mobileNumber}`);
    }
  }, [customer]);

  // Delete customer
  const handleDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      const response = await customerService.delete(customerId);
      if (response.success) {
        setDeleteDialogVisible(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete customer');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  }, [customerId, navigation]);

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton icon="phone" onPress={handleCall} iconColor={colors.white} />
          <IconButton icon="pencil" onPress={handleEdit} iconColor={colors.white} />
          <IconButton
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
            iconColor="#FFFFFF"
            containerColor="#FF6B6B"
            style={styles.deleteButton}
          />
        </View>
      ),
    });
  }, [navigation, handleCall, handleEdit]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading customer...</Text>
      </View>
    );
  }

  // Error state
  if (error || !customer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Customer not found'}</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.eventCount !== undefined && customer.eventCount > 0 && (
              <View style={styles.eventCountBadge}>
                <Text style={styles.eventCountText}>
                  {customer.eventCount} event{customer.eventCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Contact Info */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📱 Mobile</Text>
            <Text style={styles.infoValue}>{customer.mobileNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Address</Text>
            <Text style={styles.infoValue}>{customer.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏙️ Location</Text>
            <Text style={styles.infoValue}>
              {customer.city.name}, {customer.district.name}, {customer.state.name}
            </Text>
          </View>

          {customer.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.notesContainer}>
                <Text style={styles.infoLabel}>📝 Notes</Text>
                <Text style={styles.notesText}>{customer.notes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Gifts Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>🎁 Gifts</Text>
          </View>

          {gifts.length > 0 ? (
            <>
              {/* Summary */}
              {totalGiftValue > 0 && (
                <View style={styles.giftSummary}>
                  <Text style={styles.totalGiftValue}>{formatCurrency(totalGiftValue)}</Text>
                  <Text style={styles.giftCountText}>
                    {giftCount} gift{giftCount > 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              <Divider style={styles.divider} />

              {/* Gift List */}
              {gifts.map((gift, index) => (
                <View key={gift.id}>
                  <View style={styles.giftItem}>
                    <View style={styles.giftInfo}>
                      <View style={styles.giftHeader}>
                        <Text style={styles.giftType}>{gift.giftType.name}</Text>
                        <Text style={styles.giftValue}>{formatCurrency(gift.value)}</Text>
                      </View>
                      {gift.eventName && (
                        <Text style={styles.giftEventName}>
                          📅 {gift.eventName}
                        </Text>
                      )}
                      {gift.direction && (
                        <Text style={styles.giftDirection}>
                          {gift.direction === 'received' ? '📥 Received' : '📤 Given'}
                        </Text>
                      )}
                      {gift.description && (
                        <Text style={styles.giftDescription}>{gift.description}</Text>
                      )}
                    </View>

                    <View style={styles.giftActions}>
                      <IconButton
                        icon="pencil"
                        size={16}
                        iconColor={colors.primary}
                        onPress={() => handleEditGift(gift.id)}
                        style={styles.smallButton}
                      />
                      <IconButton
                        icon="delete"
                        size={16}
                        iconColor={colors.error}
                        onPress={() => setGiftToDelete(gift)}
                        style={styles.smallButton}
                      />
                    </View>
                  </View>
                  {index < gifts.length - 1 && <Divider style={styles.giftDivider} />}
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyGifts}>
              <Text style={styles.emptyGiftsText}>No gifts recorded yet</Text>
              <Text style={styles.emptyGiftsHint}>
                Gifts can be added from the Event Details screen
              </Text>
            </View>
          )}
        </View>

        {/* Created Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            Created on {new Date(customer.createdAt).toLocaleDateString('en-IN')}
            {customer.createdBy && ` by ${customer.createdBy.name}`}
          </Text>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialogs */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Customer</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete {customer.name}? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onPress={handleDelete}
              loading={isDeleting}
              textColor={colors.error}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Gift Confirmation Dialog */}
        <Dialog visible={!!giftToDelete} onDismiss={() => setGiftToDelete(null)}>
          <Dialog.Title>Delete Gift</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this {giftToDelete?.giftType.name} gift
              ({giftToDelete ? formatCurrency(giftToDelete.value) : ''})?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGiftToDelete(null)}>Cancel</Button>
            <Button onPress={handleDeleteGift} textColor={colors.error}>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
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
  headerRight: {
    flexDirection: 'row',
  },
  deleteButton: {
    borderRadius: 8,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customerName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  eventCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: '#E3F2FD',
  },
  eventCountText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    width: 100,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  notesContainer: {
    paddingVertical: spacing.xs,
  },
  notesText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  // Gift styles
  giftSummary: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  totalGiftValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.success,
  },
  giftCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  giftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  giftInfo: {
    flex: 1,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftType: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  giftValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.success,
  },
  giftEventName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftDirection: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  giftActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  smallButton: {
    margin: 0,
  },
  giftDivider: {
    marginVertical: spacing.xs,
  },
  // Empty states
  emptyGifts: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyGiftsText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: typography.fontSize.base,
  },
  emptyGiftsHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  metaInfo: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
