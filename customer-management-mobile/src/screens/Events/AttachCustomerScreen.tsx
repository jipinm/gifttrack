/**
 * Attach Customer Screen
 * Search & select a customer, set invitation status & care-of, then attach to event.
 *
 * - SuperAdmin sees all customers
 * - Admin sees only customers they created
 * - Customer Event: only one customer allowed
 * - Self Event: multiple customers, care-of is required
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { customerService } from '../../services/customerService';
import { eventService } from '../../services/eventService';
import { InvitationStatusDropdown, CareOfDropdown } from '../../components/Dropdowns';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type { Customer, InvitationStatus, CareOfOption } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'AttachCustomer'>;
type RoutePropType = RouteProp<EventStackParamList, 'AttachCustomer'>;

export default function AttachCustomerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { eventId, eventCategory } = route.params;
  const isSelfEvent = eventCategory === 'self_event';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invitationStatusId, setInvitationStatusId] = useState<number | null>(null);
  const [careOfId, setCareOfId] = useState<number | null>(null);
  const [invitationError, setInvitationError] = useState<string | undefined>();
  const [careOfError, setCareOfError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search customers with debounce
  const searchCustomers = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setCustomers([]);
        setHasSearched(false);
        return;
      }

      try {
        setIsSearching(true);
        const response = await customerService.getAll({
          search: query.trim(),
          perPage: 20,
          page: 1,
        });

        if (response.success && response.data) {
          const data = response.data as any;
          // Handle both paginated and array responses
          const list: Customer[] = Array.isArray(data)
            ? data
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data.customers)
                ? data.customers
                : [];
          setCustomers(list);
        } else {
          setCustomers([]);
        }
        setHasSearched(true);
      } catch {
        setCustomers([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, searchCustomers]);

  // Dropdown handlers
  const handleInvitationStatusSelect = useCallback(
    (item: InvitationStatus | null) => {
      setInvitationStatusId(item?.id ?? null);
      setInvitationError(undefined);
    },
    []
  );

  const handleCareOfSelect = useCallback((item: CareOfOption | null) => {
    setCareOfId(item?.id ?? null);
    setCareOfError(undefined);
  }, []);

  // Select customer
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Submit
  const handleAttach = useCallback(async () => {
    if (!selectedCustomer) return;

    // Validate
    if (!invitationStatusId) {
      setInvitationError('Invitation status is required');
      return;
    }
    if (isSelfEvent && !careOfId) {
      setCareOfError('Care Of is required for Self Event');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await eventService.attachCustomer({
        eventId,
        customerId: selectedCustomer.id,
        invitationStatusId,
        careOfId: careOfId ?? undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Customer attached successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to attach customer');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedCustomer,
    eventId,
    invitationStatusId,
    careOfId,
    isSelfEvent,
    navigation,
  ]);

  // Render customer list item
  const renderCustomerItem = useCallback(
    ({ item }: { item: Customer }) => (
      <TouchableOpacity
        style={styles.customerItem}
        onPress={() => handleSelectCustomer(item)}
        activeOpacity={0.7}
      >
        <View style={styles.customerItemContent}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}>📱 {item.mobileNumber}</Text>
          {item.address ? (
            <Text style={styles.customerAddress} numberOfLines={1}>
              📍 {item.address}
            </Text>
          ) : null}
        </View>
        <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
      </TouchableOpacity>
    ),
    [handleSelectCustomer]
  );

  return (
    <View style={styles.container}>
      {/* Search Section */}
      {!selectedCustomer && (
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />

          {isSearching && (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}

          {!isSearching && hasSearched && customers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          )}

          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderCustomerItem}
            ItemSeparatorComponent={() => <Divider />}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Selected Customer + Attachment Options */}
      {selectedCustomer && (
        <View style={styles.formSection}>
          {/* Selected customer card */}
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedLabel}>Selected Customer</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={handleClearSelection}
                iconColor={colors.textSecondary}
              />
            </View>
            <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
            <Text style={styles.selectedPhone}>
              📱 {selectedCustomer.mobileNumber}
            </Text>
            {selectedCustomer.address ? (
              <Text style={styles.selectedAddress}>
                📍 {selectedCustomer.address}
              </Text>
            ) : null}
          </View>

          {/* Invitation Status */}
          <InvitationStatusDropdown
            value={invitationStatusId}
            onSelect={handleInvitationStatusSelect}
            label="Invitation Status"
            required
            error={invitationError}
            disabled={isSubmitting}
          />

          {/* Care Of (required for Self Event) */}
          {isSelfEvent && (
            <CareOfDropdown
              value={careOfId}
              onSelect={handleCareOfSelect}
              label="Care Of"
              required
              error={careOfError}
              disabled={isSubmitting}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAttach}
              style={styles.submitButton}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Attach Customer
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    flex: 1,
  },
  searchBar: {
    margin: spacing.md,
    elevation: 2,
    backgroundColor: colors.surface,
  },
  searchInput: {
    fontSize: typography.fontSize.sm,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  searchingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  customerItemContent: {
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
  customerAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formSection: {
    flex: 1,
    padding: spacing.md,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  selectedLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  selectedName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectedPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
