/**
 * Event Details Screen
 * Shows event info with attached customers and their gifts
 * SuperAdmin can edit/delete event, all users can manage attachments
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  Dialog,
  Portal,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { eventService } from '../../services/eventService';
import { giftService } from '../../services/giftService';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Event, EventCustomer } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventDetails'>;
type RoutePropType = RouteProp<EventStackParamList, 'EventDetails'>;

export default function EventDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId } = route.params;
  const { isSuperAdmin } = useAuth();
  const isSuperAdminValue = isSuperAdmin();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [customers, setCustomers] = useState<EventCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detachTarget, setDetachTarget] = useState<EventCustomer | null>(null);

  // Load event data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const eventResponse = await eventService.getById(eventId);

      if (eventResponse.success && eventResponse.data) {
        setEvent(eventResponse.data);
        // Customers may come nested in event response
        if (eventResponse.data.customers) {
          setCustomers(eventResponse.data.customers);
        }
      } else {
        setError(eventResponse.message || 'Failed to load event');
        return;
      }

      // Also try loading attached customers separately
      try {
        const customersResponse = await eventService.getEventCustomers(eventId);
        if (customersResponse.success && customersResponse.data) {
          setCustomers(customersResponse.data);
        }
      } catch (custErr) {
        console.log('Event customers fetch fallback:', custErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

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

  // Delete event (SuperAdmin)
  const handleDeleteEvent = useCallback(async () => {
    try {
      setIsDeleting(true);
      const response = await eventService.delete(eventId);
      if (response.success) {
        setDeleteDialogVisible(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Failed to delete event');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  }, [eventId, navigation]);

  // Detach customer
  const handleDetachCustomer = useCallback(async () => {
    if (!detachTarget) return;

    try {
      const response = await eventService.detachCustomer(detachTarget.id);
      if (response.success) {
        setDetachTarget(null);
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to detach customer');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to detach customer');
    }
  }, [detachTarget, loadData]);

  // Navigate to add gift for a specific customer in this event
  const handleAddGift = useCallback(
    (customerId: string) => {
      navigation.navigate('CreateGift', { eventId, customerId });
    },
    [navigation, eventId]
  );

  // Navigate to edit gift
  const handleEditGift = useCallback(
    (giftId: string, customerId: string) => {
      navigation.navigate('EditGift', { giftId, customerId });
    },
    [navigation]
  );

  // Set header options
  useEffect(() => {
    if (isSuperAdminValue) {
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <IconButton
              icon="pencil"
              onPress={() => navigation.navigate('EditEvent', { eventId })}
              iconColor={colors.white}
            />
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
    }
  }, [navigation, isSuperAdminValue, eventId]);

  // Loading
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  // Error
  if (error || !event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Event Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventName}>{event.name}</Text>
            <View
              style={[
                styles.categoryBadge,
                event.eventCategory === 'self_event' ? styles.selfBadge : styles.customerBadge,
              ]}
            >
              <Text style={styles.categoryBadgeText}>
                {event.eventCategory === 'self_event' ? 'Self Event' : 'Customer Event'}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Date</Text>
            <Text style={styles.infoValue}>{formatDate(event.eventDate)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏷️ Type</Text>
            <Text style={styles.infoValue}>{event.eventType.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {event.giftDirection === 'received' ? '📥 Direction' : '📤 Direction'}
            </Text>
            <Text style={styles.infoValue}>
              {event.giftDirection === 'received' ? 'Gifts Received' : 'Gifts Given'}
            </Text>
          </View>

          {event.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.notesContainer}>
                <Text style={styles.infoLabel}>📝 Notes</Text>
                <Text style={styles.notesText}>{event.notes}</Text>
              </View>
            </>
          )}

          {/* Summary Stats */}
          <Divider style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.customerCount}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.giftCount}</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, styles.valueText]}>
                {formatCurrency(event.totalGiftValue)}
              </Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
          </View>
        </View>

        {/* Attached Customers Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>👥 Attached Customers</Text>
          </View>

          {customers.length > 0 ? (
            customers.map((attachment, index) => (
              <View key={attachment.id}>
                {index > 0 && <Divider style={styles.itemDivider} />}
                <View style={styles.customerItem}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>
                      {attachment.customer?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.customerPhone}>
                      📱 {attachment.customer?.mobileNumber || ''}
                    </Text>
                    <Text style={styles.attachmentDetail}>
                      📨 {attachment.invitationStatus?.name || 'N/A'}
                    </Text>
                    {attachment.careOf && (
                      <Text style={styles.attachmentDetail}>
                        👤 C/O: {attachment.careOf.name}
                      </Text>
                    )}

                    {/* Gift info for this customer */}
                    {attachment.giftCount > 0 ? (
                      <View style={styles.giftContainer}>
                        <Text style={styles.giftLabel}>
                          🎁 {attachment.giftCount} gift{attachment.giftCount > 1 ? 's' : ''} -{' '}
                          {formatCurrency(attachment.totalGiftValue)}
                        </Text>
                      </View>
                    ) : (
                      <Button
                        mode="text"
                        compact
                        icon="gift"
                        onPress={() => handleAddGift(attachment.customerId)}
                        style={styles.addGiftButton}
                      >
                        Add Gift
                      </Button>
                    )}
                  </View>

                  <View style={styles.customerActions}>
                    <IconButton
                      icon="delete"
                      size={18}
                      iconColor={colors.error}
                      onPress={() => setDetachTarget(attachment)}
                      style={styles.actionButton}
                    />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCustomers}>
              <Text style={styles.emptyText}>No customers attached yet</Text>
            </View>
          )}
        </View>

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <Text style={styles.metaText}>
            Created on {formatDate(event.createdAt)}
            {event.createdBy && ` by ${event.createdBy.name}`}
          </Text>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        {/* Delete Event Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Event</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{event.name}"? This will also remove all customer
              attachments and gifts.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onPress={handleDeleteEvent}
              loading={isDeleting}
              textColor={colors.error}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Detach Customer Dialog */}
        <Dialog visible={!!detachTarget} onDismiss={() => setDetachTarget(null)}>
          <Dialog.Title>Detach Customer</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to detach {detachTarget?.customer?.name} from this event? This
              will also delete any gifts for this customer in this event.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetachTarget(null)}>Cancel</Button>
            <Button onPress={handleDetachCustomer} textColor={colors.error}>
              Detach
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
  eventName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  selfBadge: {
    backgroundColor: '#E8F5E9',
  },
  customerBadge: {
    backgroundColor: '#E3F2FD',
  },
  categoryBadgeText: {
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
    width: 110,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  valueText: {
    color: colors.success,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemDivider: {
    marginVertical: spacing.xs,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  attachmentDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  giftContainer: {
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  giftLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addGiftButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  customerActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  actionButton: {
    margin: 0,
  },
  emptyCustomers: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
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
