/**
 * Event Details Screen
 * Shows event info with attached customers and their gifts
 * SuperAdmin can edit/delete event, all users can manage attachments
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  Dialog,
  Portal,
  Searchbar,
} from 'react-native-paper';
import { HeaderIconButton, HeaderButtonGroup } from '../../components/Common/HeaderButton';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Event, EventCustomer, InvitationStatus, CareOfOption } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';
import { InvitationStatusDropdown, CareOfDropdown } from '../../components/Dropdowns';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventDetails'>;
type RoutePropType = RouteProp<EventStackParamList, 'EventDetails'>;

export default function EventDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId } = route.params;
  const { isSuperAdmin, user } = useAuth();
  const isSuperAdminValue = isSuperAdmin();

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [customers, setCustomers] = useState<EventCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detachTarget, setDetachTarget] = useState<EventCustomer | null>(null);

  // Edit attachment state
  const [editTarget, setEditTarget] = useState<EventCustomer | null>(null);
  const [editInvitationStatusId, setEditInvitationStatusId] = useState<number | null>(null);
  const [editCareOfId, setEditCareOfId] = useState<number | null>(null);
  const [isUpdatingAttachment, setIsUpdatingAttachment] = useState(false);

  // Customer search filter (Self Events only)
  const [customerFilter, setCustomerFilter] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!customerFilter.trim()) return customers;
    const q = customerFilter.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (c.customer?.name || '').toLowerCase().includes(q) ||
        (c.customer?.mobileNumber || '').includes(q)
    );
  }, [customers, customerFilter]);

  /**
   * Normalise the customers array from either the show-endpoint format
   * or the standalone getEventCustomers format into EventCustomer[].
   */
  const normalizeCustomers = useCallback(
    (raw: any): EventCustomer[] => {
      if (!raw || !Array.isArray(raw)) return [];

      return raw.map((item: any) => {
        // Already has nested customer object (new format)
        if (item.customer && typeof item.customer === 'object') {
          return {
            ...item,
            giftCount: item.giftCount ?? 0,
            totalGiftValue: item.totalGiftValue ?? 0,
            giftDirection: item.giftDirection ?? 'received',
          } as EventCustomer;
        }
        // Legacy flat format
        return {
          id: item.id ?? item.attachmentId,
          eventId: item.eventId ?? eventId,
          customerId: item.customerId,
          customer: {
            id: item.customerId,
            name: item.name ?? 'Unknown',
            mobileNumber: item.mobileNumber ?? '',
          },
          invitationStatus: item.invitationStatus ?? { id: 0, name: 'N/A' },
          careOf: item.careOf ?? null,
          giftDirection: item.giftDirection ?? 'received',
          giftCount: item.giftCount ?? 0,
          totalGiftValue: item.totalGiftValue ?? 0,
          attachedBy: item.attachedBy ?? { id: '', name: '' },
          createdAt: item.createdAt ?? '',
        } as EventCustomer;
      });
    },
    [eventId]
  );

  // Load event data
  const loadData = useCallback(async () => {
    try {
      if (!isRefreshing) setIsLoading(true);
      setError(null);

      const eventResponse = await eventService.getById(eventId);

      if (eventResponse.success && eventResponse.data) {
        setEvent(eventResponse.data);
        if (eventResponse.data.customers) {
          setCustomers(normalizeCustomers(eventResponse.data.customers));
        }
      } else {
        setError(eventResponse.message || 'Failed to load event');
        return;
      }

      // Also try loading attached customers separately (has aggregated gift data)
      try {
        const customersResponse = await eventService.getEventCustomers(eventId);
        if (customersResponse.success && customersResponse.data) {
          const data = customersResponse.data as any;
          if (data.customers && Array.isArray(data.customers)) {
            setCustomers(normalizeCustomers(data.customers));
          } else if (Array.isArray(data)) {
            setCustomers(normalizeCustomers(data));
          }
        }
      } catch (custErr) {
        console.log('Event customers fetch fallback:', custErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [eventId, normalizeCustomers, isRefreshing]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

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
  const formatCurrency = (value?: number): string => {
    return `₹${(value ?? 0).toLocaleString('en-IN')}`;
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
        setDeleteDialogVisible(false);
        const msg = response.message || 'Failed to delete event';
        const title = msg.toLowerCase().startsWith('you cannot') ? 'Cannot Delete' : 'Error';
        Alert.alert(title, msg);
      }
    } catch (err) {
      setDeleteDialogVisible(false);
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
        setDetachTarget(null);
        const msg = response.message || 'Failed to detach customer';
        const title = msg.toLowerCase().startsWith('you cannot') ? 'Cannot Detach' : 'Error';
        Alert.alert(title, msg);
      }
    } catch (err) {
      setDetachTarget(null);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to detach customer');
    }
  }, [detachTarget, loadData]);

  // Open edit dialog for an attachment
  const handleEditAttachment = useCallback((attachment: EventCustomer) => {
    setEditTarget(attachment);
    setEditInvitationStatusId(attachment.invitationStatus?.id ?? null);
    // Care Of starts blank — user picks a new one if they want to change.
    // We never pre-load the existing care_of_id because care_of_options are
    // user-specific: the stored ID may not exist in the current user's option list.
    setEditCareOfId(null);
  }, []);

  // Close edit dialog
  const handleCloseEditDialog = useCallback(() => {
    setEditTarget(null);
    setEditInvitationStatusId(null);
    setEditCareOfId(null);
  }, []);

  // Save attachment updates
  const handleSaveAttachment = useCallback(async () => {
    if (!editTarget) return;

    try {
      setIsUpdatingAttachment(true);
      const updateData: { invitationStatusId?: number; careOfId?: number } = {};

      if (editInvitationStatusId !== null && editInvitationStatusId !== editTarget.invitationStatus?.id) {
        updateData.invitationStatusId = editInvitationStatusId;
      }
      // Only send careOfId when the user explicitly picked a new option
      if (editCareOfId !== null) {
        updateData.careOfId = editCareOfId;
      }

      // Nothing changed
      if (Object.keys(updateData).length === 0) {
        handleCloseEditDialog();
        return;
      }

      const response = await eventService.updateAttachment(editTarget.id, updateData);
      if (response.success) {
        handleCloseEditDialog();
        loadData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update attachment');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update attachment');
    } finally {
      setIsUpdatingAttachment(false);
    }
  }, [editTarget, editInvitationStatusId, editCareOfId, handleCloseEditDialog, loadData]);

  // Navigate to attach customer
  const handleAttachCustomer = useCallback(() => {
    if (!event) return;
    navigation.navigate('AttachCustomer', {
      eventId,
      eventCategory: event.eventCategory,
    });
  }, [navigation, eventId, event]);

  // Navigate to customer gifts in this event
  const handleViewGifts = useCallback(
    (attachment: EventCustomer) => {
      if (!event) return;
      navigation.navigate('EventCustomerGifts', {
        eventId,
        customerId: attachment.customerId,
        customerName: attachment.customer?.name || 'Customer',
        eventCategory: event.eventCategory,
      });
    },
    [navigation, eventId, event]
  );

  // Navigate to add gift for a specific customer in this event
  const handleAddGift = useCallback(
    (customerId: string) => {
      navigation.navigate('CreateGift', { eventId, customerId });
    },
    [navigation, eventId]
  );

  // Set header options — show edit/delete for SuperAdmin (any event) or Admin (own events)
  useEffect(() => {
    const canManage = isSuperAdminValue || (event && user && event.createdBy?.id === user.id);
    if (canManage) {
      navigation.setOptions({
        headerRight: () => (
          <HeaderButtonGroup>
            <HeaderIconButton
              icon="pencil"
              onPress={() => navigation.navigate('EditEvent', { eventId })}
            />
            <HeaderIconButton
              icon="delete"
              onPress={() => setDeleteDialogVisible(true)}
              color="#FF6B6B"
            />
          </HeaderButtonGroup>
        ),
      });
    } else {
      navigation.setOptions({ headerRight: undefined });
    }
  }, [navigation, isSuperAdminValue, eventId, event, user]);

  // Loading
  if (isLoading && !isRefreshing) {
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

  // Can attach more customers?
  const canAttachMore =
    event.eventCategory === 'self_event' || customers.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
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
            <Text style={styles.infoValue}>{event.eventType?.name || 'N/A'}</Text>
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
              <Text style={styles.statNumber}>{event.customerCount ?? 0}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{event.giftCount ?? 0}</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Attached Customers</Text>
            {canAttachMore && (
              <Button
                mode="contained-tonal"
                compact
                icon="account-plus"
                onPress={handleAttachCustomer}
              >
                Attach
              </Button>
            )}
          </View>

          {/* Search filter for Self Events with multiple customers */}
          {event.eventCategory === 'self_event' && customers.length > 2 && (
            <Searchbar
              placeholder="Filter by name or mobile..."
              value={customerFilter}
              onChangeText={setCustomerFilter}
              style={styles.customerSearchBar}
              inputStyle={styles.customerSearchInput}
            />
          )}

          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((attachment, index) => (
              <View key={attachment.id}>
                {index > 0 && <Divider style={styles.itemDivider} />}
                <View style={styles.customerItem}>
                  <TouchableOpacity
                    style={styles.customerInfo}
                    onPress={() => handleViewGifts(attachment)}
                    activeOpacity={0.7}
                  >
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

                    {/* Gift summary for this customer */}
                    {(attachment.giftCount ?? 0) > 0 ? (
                      <View style={styles.giftContainer}>
                        <Text style={styles.giftLabel}>
                          🎁 {attachment.giftCount} gift
                          {(attachment.giftCount ?? 0) > 1 ? 's' : ''} –{' '}
                          {formatCurrency(attachment.totalGiftValue)}
                        </Text>
                        <Text style={styles.tapHint}>Tap to view gifts →</Text>
                      </View>
                    ) : (
                      <View style={styles.noGiftRow}>
                        <Button
                          mode="text"
                          compact
                          icon="gift"
                          onPress={() => handleAddGift(attachment.customerId)}
                          style={styles.addGiftButton}
                        >
                          Add Gift
                        </Button>
                        <Text style={styles.tapHint}>or tap to view</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.customerActions}>
                    <IconButton
                      icon="pencil"
                      size={18}
                      iconColor={colors.primary}
                      onPress={() => handleEditAttachment(attachment)}
                      style={styles.actionButton}
                    />
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
          ) : customerFilter.trim() ? (
            <View style={styles.emptyCustomers}>
              <Text style={styles.emptyText}>No matching customers found</Text>
            </View>
          ) : (
            <View style={styles.emptyCustomers}>
              <Text style={styles.emptyText}>No customers attached yet</Text>
              <Button
                mode="contained-tonal"
                icon="account-plus"
                onPress={handleAttachCustomer}
                style={{ marginTop: spacing.sm }}
              >
                Attach Customer
              </Button>
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
              Are you sure you want to delete "{event.name}"? This action cannot be undone.
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

        {/* Edit Attachment Dialog */}
        <Dialog visible={!!editTarget} onDismiss={handleCloseEditDialog}>
          <Dialog.Title>Edit Customer Details</Dialog.Title>
          <Dialog.Content>
            {editTarget && (
              <View>
                <Text style={styles.editDialogCustomerName}>
                  {editTarget.customer?.name || 'Unknown'}
                </Text>
                <View style={styles.editDialogField}>
                  <InvitationStatusDropdown
                    value={editInvitationStatusId}
                    onSelect={(status: InvitationStatus | null) =>
                      setEditInvitationStatusId(status?.id ?? null)
                    }
                    label="Invitation Status"
                    autoSelectDefault={false}
                    disabled={isUpdatingAttachment}
                  />
                </View>
                {event?.eventCategory === 'self_event' && (
                  <View style={styles.editDialogField}>
                    {editTarget?.careOf?.name ? (
                      <View style={styles.currentValueRow}>
                        <Text style={styles.currentValueLabel}>Current Care Of:</Text>
                        <Text style={styles.currentValueText}>{editTarget.careOf.name}</Text>
                      </View>
                    ) : null}
                    <CareOfDropdown
                      value={editCareOfId}
                      onSelect={(careOf: CareOfOption | null) =>
                        setEditCareOfId(careOf?.id ?? null)
                      }
                      label={editTarget?.careOf?.name ? 'Change Care Of' : 'Care Of'}
                      placeholder={editTarget?.careOf?.name ? 'Select to change...' : 'Select Care Of'}
                      autoSelectDefault={false}
                      disabled={isUpdatingAttachment}
                    />
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseEditDialog} disabled={isUpdatingAttachment}>
              Cancel
            </Button>
            <Button
              onPress={handleSaveAttachment}
              loading={isUpdatingAttachment}
              disabled={isUpdatingAttachment}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Detach Customer Dialog */}
        <Dialog visible={!!detachTarget} onDismiss={() => setDetachTarget(null)}>
          <Dialog.Title>Detach Customer</Dialog.Title>
          <Dialog.Content>
            {(detachTarget?.giftCount ?? 0) > 0 ? (
              <Text>
                {detachTarget?.customer?.name} has {detachTarget?.giftCount} gift(s) linked to this event.
                Please delete all related gifts first before detaching.
              </Text>
            ) : (
              <Text>
                Are you sure you want to detach {detachTarget?.customer?.name} from this event?
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetachTarget(null)}>Cancel</Button>
            {(detachTarget?.giftCount ?? 0) === 0 && (
              <Button onPress={handleDetachCustomer} textColor={colors.error}>
                Detach
              </Button>
            )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  customerSearchBar: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    elevation: 0,
    marginBottom: spacing.sm,
    height: 40,
  },
  customerSearchInput: {
    fontSize: typography.fontSize.sm,
    minHeight: 0,
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
  tapHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  noGiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  addGiftButton: {
    marginLeft: -spacing.sm,
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
  editDialogCustomerName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  editDialogField: {
    marginBottom: spacing.sm,
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  currentValueLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  currentValueText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
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
