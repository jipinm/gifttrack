/**
 * Create Event Screen
 * Form for creating a new event with optional customer & gift attachment
 * (Customer attachment + gift is for Customer Events only)
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform, TouchableOpacity, FlatList, ScrollView, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  Searchbar,
  ActivityIndicator,
  Divider,
  IconButton,
  Portal,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { eventService } from '../../services/eventService';
import { customerService } from '../../services/customerService';
import { giftService } from '../../services/giftService';
import {
  EventTypeDropdown,
  InvitationStatusDropdown,
  CareOfDropdown,
  GiftTypeDropdown,
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
} from '../../components/Dropdowns';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type {
  EventType,
  EventInput,
  EventCategory,
  Customer,
  InvitationStatus,
  CareOfOption,
  GiftType,
  EventCustomer,
  Gift,
  CustomerGiftsResponse,
} from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList, 'CreateEvent'>;

export default function CreateEventScreen() {
  const navigation = useNavigation<NavigationProp>();

  // ==========================================
  // Event form state
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventTypeId, setEventTypeId] = useState<number | null>(null);
  const [eventTypeError, setEventTypeError] = useState<string | undefined>();
  const [eventCategory, setEventCategory] = useState<EventCategory>('self_event');
  const [notes, setNotes] = useState('');

  // ==========================================
  // Customer attachment state (customer_event only)
  // ==========================================
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerMobile, setNewCustomerMobile] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerStateId, setNewCustomerStateId] = useState<number | null>(null);
  const [newCustomerDistrictId, setNewCustomerDistrictId] = useState<number | null>(null);
  const [newCustomerCityId, setNewCustomerCityId] = useState<number | null>(null);
  const [newCustomerNameError, setNewCustomerNameError] = useState<string | undefined>();
  const [newCustomerMobileError, setNewCustomerMobileError] = useState<string | undefined>();
  const [newCustomerAddressError, setNewCustomerAddressError] = useState<string | undefined>();
  const [newCustomerStateError, setNewCustomerStateError] = useState<string | undefined>();
  const [newCustomerDistrictError, setNewCustomerDistrictError] = useState<string | undefined>();
  const [newCustomerCityError, setNewCustomerCityError] = useState<string | undefined>();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Invitation status
  const [invitationStatusId, setInvitationStatusId] = useState<number | null>(null);
  const [invitationError, setInvitationError] = useState<string | undefined>();

  // Care Of (for self_event)
  const [careOfId, setCareOfId] = useState<number | null>(null);
  const [careOfError, setCareOfError] = useState<string | undefined>();

  // ==========================================
  // Gift state (optional, after customer selected)
  // ==========================================
  const [giftTypeId, setGiftTypeId] = useState<number | null>(null);
  const [giftValue, setGiftValue] = useState('');
  const [giftDescription, setGiftDescription] = useState('');

  // ==========================================
  // Customer history modal state
  // ==========================================
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalType, setHistoryModalType] = useState<'events' | 'gifts'>('events');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerEvents, setCustomerEvents] = useState<EventCustomer[]>([]);
  const [customerGifts, setCustomerGifts] = useState<Gift[]>([]);
  const [customerGiftTotalValue, setCustomerGiftTotalValue] = useState(0);

  const isCustomerEvent = eventCategory === 'customer_event';

  // Reset customer/gift state when category changes
  useEffect(() => {
    setSelectedCustomer(null);
    setShowNewCustomerForm(false);
    setCustomerSearch('');
    setSearchResults([]);
    setHasSearched(false);
    setInvitationStatusId(null);
    setCareOfId(null);
    setGiftTypeId(null);
    setGiftValue('');
    setGiftDescription('');
    setInvitationError(undefined);
    setCareOfError(undefined);
  }, [eventCategory]);

  // ==========================================
  // Date picker handler
  // ==========================================
  const handleDateChange = useCallback((_: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  }, []);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ==========================================
  // Dropdown handlers
  // ==========================================
  const handleEventTypeSelect = useCallback((eventType: EventType | null) => {
    setEventTypeId(eventType?.id ?? null);
    setEventTypeError(undefined);
  }, []);

  const handleInvitationStatusSelect = useCallback((item: InvitationStatus | null) => {
    setInvitationStatusId(item?.id ?? null);
    setInvitationError(undefined);
  }, []);

  const handleCareOfSelect = useCallback((item: CareOfOption | null) => {
    setCareOfId(item?.id ?? null);
    setCareOfError(undefined);
  }, []);

  const handleGiftTypeSelect = useCallback((giftType: GiftType | null) => {
    setGiftTypeId(giftType?.id ?? null);
  }, []);

  // ==========================================
  // Customer search (debounced)
  // ==========================================
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
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
        const list: Customer[] = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.customers)
              ? data.customers
              : [];
        setSearchResults(list);
      } else {
        setSearchResults([]);
      }
      setHasSearched(true);
    } catch {
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isCustomerEvent) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchCustomers(customerSearch);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [customerSearch, searchCustomers, isCustomerEvent]);

  // ==========================================
  // Customer selection helpers
  // ==========================================
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowNewCustomerForm(false);
    setCustomerSearch('');
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setInvitationStatusId(null);
    setCareOfId(null);
    setInvitationError(undefined);
    setCareOfError(undefined);
    setGiftTypeId(null);
    setGiftValue('');
    setGiftDescription('');
  }, []);

  const handleShowNewCustomerForm = useCallback(() => {
    setShowNewCustomerForm(true);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setSearchResults([]);
    setHasSearched(false);
  }, []);

  const handleCancelNewCustomer = useCallback(() => {
    setShowNewCustomerForm(false);
    setNewCustomerName('');
    setNewCustomerMobile('');
    setNewCustomerAddress('');
    setNewCustomerStateId(null);
    setNewCustomerDistrictId(null);
    setNewCustomerCityId(null);
    setNewCustomerNameError(undefined);
    setNewCustomerMobileError(undefined);
    setNewCustomerAddressError(undefined);
    setNewCustomerStateError(undefined);
    setNewCustomerDistrictError(undefined);
    setNewCustomerCityError(undefined);
  }, []);

  // ==========================================
  // Customer history handlers
  // ==========================================
  const formatHistoryDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const handleViewHistory = useCallback(async (type: 'events' | 'gifts') => {
    if (!selectedCustomer) return;

    setHistoryModalType(type);
    setHistoryModalVisible(true);
    setHistoryLoading(true);

    try {
      if (type === 'events') {
        const response = await customerService.getCustomerEvents(selectedCustomer.id);
        if (response.success && response.data) {
          setCustomerEvents(response.data.events || []);
        } else {
          setCustomerEvents([]);
        }
      } else {
        const response = await giftService.getCustomerGifts(selectedCustomer.id);
        if (response.success && response.data) {
          const giftData = response.data as CustomerGiftsResponse;
          setCustomerGifts(giftData.gifts || []);
          setCustomerGiftTotalValue(giftData.totalValue || 0);
        } else {
          setCustomerGifts([]);
          setCustomerGiftTotalValue(0);
        }
      }
    } catch {
      if (type === 'events') {
        setCustomerEvents([]);
      } else {
        setCustomerGifts([]);
        setCustomerGiftTotalValue(0);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedCustomer]);

  const handleCloseHistoryModal = useCallback(() => {
    setHistoryModalVisible(false);
    setCustomerEvents([]);
    setCustomerGifts([]);
    setCustomerGiftTotalValue(0);
  }, []);

  // ==========================================
  // Submit handler
  // ==========================================
  const handleSubmit = useCallback(async () => {
    // Validate event fields
    let hasError = false;

    if (!name.trim()) {
      setNameError('Event name is required');
      hasError = true;
    } else {
      setNameError(undefined);
    }

    if (!eventTypeId) {
      setEventTypeError('Event type is required');
      hasError = true;
    }

    // Validate customer fields for customer_event if customer is being attached
    const isAttachingCustomer = isCustomerEvent && (selectedCustomer || showNewCustomerForm);

    if (isAttachingCustomer) {
      // Validate new customer form
      if (showNewCustomerForm) {
        if (!newCustomerName.trim()) {
          setNewCustomerNameError('Name is required');
          hasError = true;
        }
        if (newCustomerMobile && !/^\d{10}$/.test(newCustomerMobile)) {
          setNewCustomerMobileError('Mobile number must be exactly 10 digits');
          hasError = true;
        }
        if (!newCustomerAddress.trim()) {
          setNewCustomerAddressError('Address is required');
          hasError = true;
        }
        if (!newCustomerStateId) {
          setNewCustomerStateError('State is required');
          hasError = true;
        }
        if (!newCustomerDistrictId) {
          setNewCustomerDistrictError('District is required');
          hasError = true;
        }
        if (!newCustomerCityId) {
          setNewCustomerCityError('City is required');
          hasError = true;
        }
      }

      // Validate invitation status
      if (!invitationStatusId) {
        setInvitationError('Invitation status is required');
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      setIsSubmitting(true);

      // Step 1: Create the event
      const eventData: EventInput = {
        name: name.trim(),
        eventDate: eventDate.toISOString().split('T')[0],
        eventTypeId: eventTypeId!,
        eventCategory,
        notes: notes.trim() || undefined,
      };

      const eventResponse = await eventService.create(eventData);

      if (!eventResponse.success) {
        Alert.alert('Error', eventResponse.message || 'Failed to create event');
        return;
      }

      const newEvent = eventResponse.data as any;
      const newEventId = newEvent?.id;

      if (!newEventId) {
        Alert.alert('Error', 'Event created but no ID returned');
        return;
      }

      // Step 2: If customer_event with customer, create customer if needed & attach
      if (isAttachingCustomer) {
        let customerId: string | null = selectedCustomer?.id ?? null;

        // Create new customer if using new customer form
        if (showNewCustomerForm && !customerId) {
          try {
            const custResponse = await customerService.create({
              name: newCustomerName.trim(),
              mobileNumber: newCustomerMobile?.trim() || undefined,
              address: newCustomerAddress.trim(),
              stateId: newCustomerStateId!,
              districtId: newCustomerDistrictId!,
              cityId: newCustomerCityId!,
            });

            if (custResponse.success && custResponse.data) {
              const newCust = custResponse.data as any;
              customerId = newCust?.id ?? null;
            } else {
              Alert.alert(
                'Partial Success',
                `Event created, but failed to create customer: ${custResponse.message || 'Unknown error'}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
              return;
            }
          } catch (custErr) {
            Alert.alert(
              'Partial Success',
              `Event created, but failed to create customer: ${custErr instanceof Error ? custErr.message : 'Unknown error'}`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          }
        }

        // Attach customer to event
        if (customerId) {
          try {
            const attachResponse = await eventService.attachCustomer({
              eventId: newEventId,
              customerId,
              invitationStatusId: invitationStatusId!,
              careOfId: careOfId ?? undefined,
            });

            if (!attachResponse.success) {
              Alert.alert(
                'Partial Success',
                `Event created, but failed to attach customer: ${attachResponse.message || 'Unknown error'}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
              return;
            }

            // Step 3: If gift value is entered, create gift
            if (giftValue && parseFloat(giftValue) > 0 && giftTypeId) {
              try {
                await giftService.createGift({
                  eventId: newEventId,
                  customerId,
                  giftTypeId,
                  value: parseFloat(giftValue),
                  description: giftDescription.trim() || undefined,
                });
              } catch {
                // Gift creation failed but event + customer attachment succeeded
                Alert.alert(
                  'Partial Success',
                  'Event created and customer attached, but gift creation failed.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return;
              }
            }
          } catch (attachErr) {
            Alert.alert(
              'Partial Success',
              `Event created, but failed to attach customer: ${attachErr instanceof Error ? attachErr.message : 'Unknown error'}`,
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
            return;
          }
        }
      }

      // Full success
      const successMsg = isAttachingCustomer
        ? 'Event created with customer attached successfully'
        : 'Event created successfully';

      Alert.alert('Success', successMsg, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name, eventDate, eventTypeId, eventCategory, notes,
    isCustomerEvent, selectedCustomer, showNewCustomerForm,
    newCustomerName, newCustomerMobile, newCustomerAddress,
    newCustomerStateId, newCustomerDistrictId, newCustomerCityId,
    invitationStatusId, careOfId,
    giftTypeId, giftValue, giftDescription,
    navigation,
  ]);

  // ==========================================
  // Render customer search result item
  // ==========================================
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
        </View>
        <IconButton icon="chevron-right" size={20} iconColor={colors.textSecondary} />
      </TouchableOpacity>
    ),
    [handleSelectCustomer]
  );

  return (
    <>
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={150}
      extraHeight={150}
      viewIsInsideTabBar={true}
      enableResetScrollToCoords={false}
    >
      {/* Event Name */}
      <View style={styles.inputContainer}>
        <TextInput
          label="Event Name *"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          mode="outlined"
          error={!!nameError}
          disabled={isSubmitting}
          placeholder="e.g., Diwali Celebration 2024"
        />
        {nameError && <Text style={styles.errorText}>{nameError}</Text>}
      </View>

      {/* Event Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Date *</Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          icon="calendar"
          contentStyle={styles.dateButtonContent}
          style={styles.dateButton}
          disabled={isSubmitting}
        >
          {formatDate(eventDate)}
        </Button>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={eventDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Event Type Dropdown */}
      <View style={styles.inputContainer}>
        <EventTypeDropdown
          value={eventTypeId}
          onSelect={handleEventTypeSelect}
          label="Event Type *"
          error={eventTypeError}
          disabled={isSubmitting}
        />
      </View>

      {/* Event Category */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Event Category *</Text>
        <SegmentedButtons
          value={eventCategory}
          onValueChange={(value) => setEventCategory(value as EventCategory)}
          buttons={[
            {
              value: 'self_event',
              label: 'Self Event',
              icon: 'account',
            },
            {
              value: 'customer_event',
              label: 'Customer Event',
              icon: 'account-group',
            },
          ]}
          style={styles.segmentedButtons}
        />
        <Text style={styles.categoryHint}>
          {eventCategory === 'self_event'
            ? '📥 Self Event: Gifts will be received from customers'
            : '📤 Customer Event: Gifts will be given to customers'}
        </Text>
      </View>

      {/* Notes */}
      <View style={styles.inputContainer}>
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          disabled={isSubmitting}
          style={styles.notesInput}
        />
      </View>

      {/* ==========================================
          Customer Event — Optional Customer Attachment
          ========================================== */}
      {isCustomerEvent && (
        <View style={styles.customerSection}>
          <Divider style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>👤 Attach Customer (Optional)</Text>
          <Text style={styles.sectionHint}>
            Search for an existing customer or add a new one.
          </Text>

          {/* Customer Search (when no customer selected and not adding new) */}
          {!selectedCustomer && !showNewCustomerForm && (
            <View>
              <Searchbar
                placeholder="Search by name or mobile..."
                value={customerSearch}
                onChangeText={setCustomerSearch}
                style={styles.searchBar}
                inputStyle={styles.searchInput}
              />

              {isSearching && (
                <View style={styles.searchingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.searchingText}>Searching...</Text>
                </View>
              )}

              {!isSearching && hasSearched && searchResults.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No customers found</Text>
                </View>
              )}

              {searchResults.length > 0 && (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCustomerItem}
                  ItemSeparatorComponent={() => <Divider />}
                  scrollEnabled={false}
                  style={styles.searchResults}
                />
              )}

              {/* Add New Customer button */}
              <Button
                mode="outlined"
                icon="account-plus"
                onPress={handleShowNewCustomerForm}
                style={styles.addNewButton}
                disabled={isSubmitting}
              >
                Add New Customer
              </Button>
            </View>
          )}

          {/* Selected Customer Card */}
          {selectedCustomer && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedLabel}>Selected Customer</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={handleClearCustomer}
                  iconColor={colors.textSecondary}
                />
              </View>
              <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
              <Text style={styles.selectedPhone}>
                📱 {selectedCustomer.mobileNumber}
              </Text>

              {/* History quick-view buttons */}
              <View style={styles.historyButtonRow}>
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => handleViewHistory('events')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.historyButtonIcon}>📋</Text>
                  <Text style={styles.historyButtonText}>Event History</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => handleViewHistory('gifts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.historyButtonIcon}>🎁</Text>
                  <Text style={styles.historyButtonText}>Gift History</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New Customer Form */}
          {showNewCustomerForm && (
            <View style={styles.newCustomerCard}>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedLabel}>New Customer</Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={handleCancelNewCustomer}
                  iconColor={colors.textSecondary}
                />
              </View>
              <TextInput
                label="Customer Name *"
                value={newCustomerName}
                onChangeText={(t) => { setNewCustomerName(t); setNewCustomerNameError(undefined); }}
                mode="outlined"
                error={!!newCustomerNameError}
                disabled={isSubmitting}
                style={styles.newCustInput}
              />
              {newCustomerNameError && <Text style={styles.errorText}>{newCustomerNameError}</Text>}

              <TextInput
                label="Mobile Number"
                value={newCustomerMobile}
                onChangeText={(t) => { setNewCustomerMobile(t); setNewCustomerMobileError(undefined); }}
                mode="outlined"
                keyboardType="phone-pad"
                maxLength={10}
                error={!!newCustomerMobileError}
                disabled={isSubmitting}
                style={styles.newCustInput}
              />
              {newCustomerMobileError && <Text style={styles.errorText}>{newCustomerMobileError}</Text>}

              <TextInput
                label="Address *"
                value={newCustomerAddress}
                onChangeText={(t) => { setNewCustomerAddress(t); setNewCustomerAddressError(undefined); }}
                mode="outlined"
                multiline
                numberOfLines={2}
                error={!!newCustomerAddressError}
                disabled={isSubmitting}
                style={styles.newCustInput}
              />
              {newCustomerAddressError && <Text style={styles.errorText}>{newCustomerAddressError}</Text>}

              <StateDropdown
                value={newCustomerStateId}
                onSelect={(state) => {
                  setNewCustomerStateId(state?.id ?? null);
                  setNewCustomerDistrictId(null);
                  setNewCustomerCityId(null);
                  setNewCustomerStateError(undefined);
                }}
                label="State"
                error={newCustomerStateError}
                disabled={isSubmitting}
                required
              />

              <DistrictDropdown
                value={newCustomerDistrictId}
                stateId={newCustomerStateId}
                onSelect={(district) => {
                  setNewCustomerDistrictId(district?.id ?? null);
                  setNewCustomerCityId(null);
                  setNewCustomerDistrictError(undefined);
                }}
                label="District"
                error={newCustomerDistrictError}
                disabled={isSubmitting || !newCustomerStateId}
                required
              />

              <CityDropdown
                value={newCustomerCityId}
                districtId={newCustomerDistrictId}
                onSelect={(city) => {
                  setNewCustomerCityId(city?.id ?? null);
                  setNewCustomerCityError(undefined);
                }}
                label="City"
                error={newCustomerCityError}
                disabled={isSubmitting || !newCustomerDistrictId}
                required
              />
            </View>
          )}

          {/* Invitation Status (when customer is selected/being created) */}
          {(selectedCustomer || showNewCustomerForm) && (
            <View style={styles.attachmentFields}>
              <InvitationStatusDropdown
                value={invitationStatusId}
                onSelect={handleInvitationStatusSelect}
                label="Invitation Status"
                required
                error={invitationError}
                disabled={isSubmitting}
              />

              {/* Gift Section (Optional) */}
              <Divider style={styles.fieldDivider} />
              <Text style={styles.subSectionTitle}>🎁 Add Gift (Optional)</Text>

              <GiftTypeDropdown
                value={giftTypeId}
                onSelect={handleGiftTypeSelect}
                label="Gift Type"
                disabled={isSubmitting}
              />

              <TextInput
                label="Gift Value"
                value={giftValue}
                onChangeText={setGiftValue}
                mode="outlined"
                keyboardType="numeric"
                disabled={isSubmitting}
                style={styles.giftInput}
              />

              <TextInput
                label="Gift Description (Optional)"
                value={giftDescription}
                onChangeText={setGiftDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                disabled={isSubmitting}
                style={styles.giftInput}
              />
            </View>
          )}
        </View>
      )}

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isSubmitting ? 'Creating Event...' : 'Create Event'}
      </Button>
    </KeyboardAwareScrollView>

    {/* Customer History Modal */}
    <Modal
      visible={historyModalVisible}
      animationType="slide"
      transparent
      onRequestClose={handleCloseHistoryModal}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.modalOverlay} edges={['bottom']}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {historyModalType === 'events' ? '📋 Event History' : '🎁 Gift History'}
            </Text>
            <IconButton
              icon="close"
              size={22}
              onPress={handleCloseHistoryModal}
              iconColor={colors.textSecondary}
            />
          </View>
          {selectedCustomer && (
            <Text style={styles.modalSubtitle}>{selectedCustomer.name}</Text>
          )}
          <Divider style={styles.modalDivider} />

          {/* Modal Body */}
          {historyLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.modalLoadingText}>Loading...</Text>
            </View>
          ) : historyModalType === 'events' ? (
            /* Event History Content */
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {customerEvents.length > 0 ? (
                customerEvents.map((ec, index) => (
                  <View key={ec.id}>
                    <View style={styles.historyEventItem}>
                      <View style={styles.historyEventHeader}>
                        <Text style={styles.historyEventName}>
                          {ec.event?.name || 'Unknown Event'}
                        </Text>
                        {ec.event?.eventCategory && (
                          <View style={[
                            styles.historyBadge,
                            ec.event.eventCategory === 'self_event'
                              ? styles.historyBadgeSelf
                              : styles.historyBadgeCustomer,
                          ]}>
                            <Text style={styles.historyBadgeText}>
                              {ec.event.eventCategory === 'self_event' ? 'Self' : 'Customer'}
                            </Text>
                          </View>
                        )}
                      </View>
                      {ec.event?.eventDate && (
                        <Text style={styles.historyEventDate}>
                          📅 {formatHistoryDate(ec.event.eventDate)}
                        </Text>
                      )}
                      <View style={styles.historyEventMeta}>
                        <Text style={styles.historyEventMetaText}>
                          {ec.invitationStatus?.name || 'N/A'}
                        </Text>
                        {ec.giftCount > 0 && (
                          <Text style={styles.historyEventMetaText}>
                            {' · '}{ec.giftCount} gift{ec.giftCount > 1 ? 's' : ''} ({formatCurrency(ec.totalGiftValue)})
                          </Text>
                        )}
                      </View>
                      {ec.giftDirection && (
                        <Text style={styles.historyDirection}>
                          {ec.giftDirection === 'received' ? '📥 Received' : '📤 Given'}
                        </Text>
                      )}
                    </View>
                    {index < customerEvents.length - 1 && <Divider style={styles.historyDivider} />}
                  </View>
                ))
              ) : (
                <View style={styles.historyEmpty}>
                  <Text style={styles.historyEmptyText}>No events found</Text>
                  <Text style={styles.historyEmptyHint}>
                    This customer has not been attached to any events yet.
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : (
            /* Gift History Content */
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {customerGifts.length > 0 ? (
                <>
                  {/* Separate Given / Received Summaries */}
                  {(() => {
                    const givenGifts = customerGifts.filter((g) => g.direction === 'given');
                    const receivedGifts = customerGifts.filter((g) => g.direction === 'received');
                    const givenTotal = givenGifts.reduce((sum, g) => sum + g.value, 0);
                    const receivedTotal = receivedGifts.reduce((sum, g) => sum + g.value, 0);
                    return (
                      <View style={styles.giftSummaryRow}>
                        {receivedGifts.length > 0 && (
                          <View style={styles.giftSummaryBlock}>
                            <Text style={styles.summaryDirectionLabel}>📥 Received</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(receivedTotal)}</Text>
                            <Text style={styles.summaryCount}>
                              {receivedGifts.length} gift{receivedGifts.length > 1 ? 's' : ''}
                            </Text>
                          </View>
                        )}
                        {givenGifts.length > 0 && (
                          <View style={styles.giftSummaryBlock}>
                            <Text style={styles.summaryDirectionLabel}>📤 Given</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(givenTotal)}</Text>
                            <Text style={styles.summaryCount}>
                              {givenGifts.length} gift{givenGifts.length > 1 ? 's' : ''}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}

                  <Divider style={styles.historyDivider} />

                  {/* Gift List — sorted by event date ascending */}
                  {[...customerGifts]
                    .sort((a, b) => {
                      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
                      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
                      return dateA - dateB;
                    })
                    .map((gift, index) => (
                      <View key={gift.id}>
                        <View style={styles.historyGiftItem}>
                          <View style={styles.historyGiftHeader}>
                            <Text style={styles.historyGiftType}>{gift.giftType.name}</Text>
                            <Text style={styles.historyGiftValue}>{formatCurrency(gift.value)}</Text>
                          </View>
                          {gift.eventName && (
                            <Text style={styles.historyGiftEventName}>
                              📅 {gift.eventName}
                              {gift.eventDate ? ` · ${formatHistoryDate(gift.eventDate)}` : ''}
                            </Text>
                          )}
                          {gift.direction && (
                            <Text style={styles.historyDirection}>
                              {gift.direction === 'received' ? '📥 Received' : '📤 Given'}
                            </Text>
                          )}
                          {gift.description ? (
                            <Text style={styles.historyGiftDesc}>{gift.description}</Text>
                          ) : null}
                        </View>
                        {index < customerGifts.length - 1 && (
                          <Divider style={styles.historyDivider} />
                        )}
                      </View>
                    ))}
                </>
              ) : (
                <View style={styles.historyEmpty}>
                  <Text style={styles.historyEmptyText}>No gifts recorded yet</Text>
                  <Text style={styles.historyEmptyHint}>
                    Gifts can be added from the Event Details screen.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  dateButton: {
    borderColor: colors.border,
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  categoryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  notesInput: {
    backgroundColor: colors.surface,
  },
  submitButton: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  // Customer section
  customerSection: {
    marginTop: spacing.sm,
  },
  sectionDivider: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    elevation: 1,
    marginBottom: spacing.sm,
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
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  searchResults: {
    maxHeight: 200,
    marginBottom: spacing.sm,
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
  addNewButton: {
    marginTop: spacing.sm,
    borderColor: colors.primary,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
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
  newCustomerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    ...shadows.sm,
  },
  newCustInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  attachmentFields: {
    marginTop: spacing.md,
  },
  fieldDivider: {
    marginVertical: spacing.md,
  },
  subSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  giftInput: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
  },
  // ==========================================
  // History button styles
  // ==========================================
  historyButtonRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  historyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: '#F0F0F6',
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  historyButtonIcon: {
    fontSize: 14,
  },
  historyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  // ==========================================
  // History modal styles
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  modalDivider: {
    marginVertical: spacing.sm,
  },
  modalLoading: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  modalScroll: {
    paddingHorizontal: spacing.md,
  },
  // Event history items
  historyEventItem: {
    paddingVertical: spacing.sm,
  },
  historyEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyEventName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  historyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  historyBadgeSelf: {
    backgroundColor: '#E3F2FD',
  },
  historyBadgeCustomer: {
    backgroundColor: '#FFF3E0',
  },
  historyBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyEventDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyEventMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  historyEventMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  historyDirection: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyDivider: {
    marginVertical: spacing.xs,
  },
  // Gift history summary
  giftSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  giftSummaryBlock: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDirectionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.success,
  },
  summaryCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Gift history items
  historyGiftItem: {
    paddingVertical: spacing.sm,
  },
  historyGiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyGiftType: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyGiftValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.success,
  },
  historyGiftEventName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyGiftDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  // Empty states
  historyEmpty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  historyEmptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: typography.fontSize.base,
  },
  historyEmptyHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
