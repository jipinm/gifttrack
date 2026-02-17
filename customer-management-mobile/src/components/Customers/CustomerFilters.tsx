/**
 * Customer Filters Component
 * Filter modal for customer list — location filters + event-based filters
 *
 * Event-based filters (Care Of, Invitation Status, Gift status) appear
 * only after selecting an Event.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal as RNModal, Dimensions } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Divider,
  IconButton,
  Searchbar,
  ActivityIndicator,
} from 'react-native-paper';
import {
  StateDropdown,
  DistrictDropdown,
  CityDropdown,
  InvitationStatusDropdown,
  CareOfDropdown,
} from '../Dropdowns';
import { eventService } from '../../services/eventService';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';
import type {
  CustomerFilters as FilterType,
  State,
  District,
  City,
  Event,
  InvitationStatus,
  CareOfOption,
} from '../../types';

interface CustomerFiltersProps {
  visible: boolean;
  onDismiss: () => void;
  filters: FilterType;
  onApply: (filters: FilterType) => void;
  onClear: () => void;
}

export default function CustomerFilters({
  visible,
  onDismiss,
  filters,
  onApply,
  onClear,
}: CustomerFiltersProps) {
  // Location filters
  const [stateId, setStateId] = useState<number | null>(filters.stateId ?? null);
  const [districtId, setDistrictId] = useState<number | null>(filters.districtId ?? null);
  const [cityId, setCityId] = useState<number | null>(filters.cityId ?? null);

  // Event-based filters
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(filters.eventId);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [careOfId, setCareOfId] = useState<number | null>(filters.careOfId ?? null);
  const [invitationStatusId, setInvitationStatusId] = useState<number | null>(
    filters.invitationStatusId ?? null
  );
  const [giftStatus, setGiftStatus] = useState<'gifted' | 'not_gifted' | undefined>(
    filters.giftStatus
  );
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedEvents = useRef(false);

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setStateId(filters.stateId ?? null);
      setDistrictId(filters.districtId ?? null);
      setCityId(filters.cityId ?? null);
      setSelectedEventId(filters.eventId);
      setCareOfId(filters.careOfId ?? null);
      setInvitationStatusId(filters.invitationStatusId ?? null);
      setGiftStatus(filters.giftStatus);

      // Load events on first open
      if (!hasLoadedEvents.current) {
        loadEvents();
        hasLoadedEvents.current = true;
      }
    }
  }, [visible, filters]);

  // Restore selectedEvent object from ID
  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const found = events.find((e) => e.id === selectedEventId);
      setSelectedEvent(found ?? null);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId, events]);

  // Load events
  const loadEvents = useCallback(async (search?: string) => {
    try {
      setIsLoadingEvents(true);
      const response = await eventService.getAll({
        search: search || undefined,
        perPage: 50,
        page: 1,
      });
      if (response.success && response.data) {
        const raw = response.data as any;
        const list: Event[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw.events)
            ? raw.events
            : Array.isArray(raw.data)
              ? raw.data
              : [];
        setEvents(list);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Debounced event search
  useEffect(() => {
    if (!visible) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      loadEvents(eventSearchQuery);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [eventSearchQuery, loadEvents, visible]);

  // Location handlers
  const handleStateSelect = useCallback((state: State | null) => {
    setStateId(state?.id ?? null);
    setDistrictId(null);
    setCityId(null);
  }, []);

  const handleDistrictSelect = useCallback((district: District | null) => {
    setDistrictId(district?.id ?? null);
    setCityId(null);
  }, []);

  const handleCitySelect = useCallback((city: City | null) => {
    setCityId(city?.id ?? null);
  }, []);

  // Event selection
  const handleSelectEvent = useCallback((event: Event) => {
    setSelectedEventId(event.id);
    setSelectedEvent(event);
  }, []);

  const handleClearEvent = useCallback(() => {
    setSelectedEventId(undefined);
    setSelectedEvent(null);
    setCareOfId(null);
    setInvitationStatusId(null);
    setGiftStatus(undefined);
  }, []);

  // Event-based filter handlers
  const handleInvitationStatusSelect = useCallback((item: InvitationStatus | null) => {
    setInvitationStatusId(item?.id ?? null);
  }, []);

  const handleCareOfSelect = useCallback((item: CareOfOption | null) => {
    setCareOfId(item?.id ?? null);
  }, []);

  // Apply
  const handleApply = useCallback(() => {
    const newFilters: FilterType = {
      ...filters,
      stateId: stateId ?? undefined,
      districtId: districtId ?? undefined,
      cityId: cityId ?? undefined,
      eventId: selectedEventId,
      careOfId: careOfId ?? undefined,
      invitationStatusId: invitationStatusId ?? undefined,
      giftStatus: giftStatus,
      page: 1,
    };
    onApply(newFilters);
    onDismiss();
  }, [filters, stateId, districtId, cityId, selectedEventId, careOfId, invitationStatusId, giftStatus, onApply, onDismiss]);

  // Clear all
  const handleClear = useCallback(() => {
    setStateId(null);
    setDistrictId(null);
    setCityId(null);
    setSelectedEventId(undefined);
    setSelectedEvent(null);
    setCareOfId(null);
    setInvitationStatusId(null);
    setGiftStatus(undefined);
    onClear();
    onDismiss();
  }, [onClear, onDismiss]);

  const hasActiveFilters =
    stateId || districtId || cityId || selectedEventId || careOfId || invitationStatusId || giftStatus;

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Filters
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <Divider />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* ===== Location Filters ===== */}
          <Text style={styles.sectionLabel}>📍 Location</Text>

          <StateDropdown
            value={stateId}
            onSelect={handleStateSelect}
            label="State"
            required={false}
          />

          <DistrictDropdown
            value={districtId}
            stateId={stateId}
            onSelect={handleDistrictSelect}
            label="District"
            required={false}
          />

          <CityDropdown
            value={cityId}
            districtId={districtId}
            onSelect={handleCitySelect}
            label="City"
            required={false}
          />

          <Divider style={styles.sectionDivider} />

          {/* ===== Event Filter ===== */}
          <Text style={styles.sectionLabel}>📅 Event Filter</Text>

          {/* Event Dropdown Trigger */}
          <TouchableOpacity
            style={styles.eventDropdownTrigger}
            onPress={() => {
              setEventModalVisible(true);
              if (events.length === 0) loadEvents();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.eventDropdownContent}>
              {selectedEvent ? (
                <>
                  <Text style={styles.eventDropdownValue} numberOfLines={1}>
                    {selectedEvent.name}
                  </Text>
                  <Text style={styles.eventDropdownMeta}>
                    {formatDate(selectedEvent.eventDate)} •{' '}
                    {selectedEvent.eventCategory === 'self_event' ? 'Self Event' : 'Customer Event'}
                  </Text>
                </>
              ) : (
                <Text style={styles.eventDropdownPlaceholder}>Select Event</Text>
              )}
            </View>
            <View style={styles.eventDropdownActions}>
              {selectedEvent && (
                <IconButton
                  icon="close"
                  size={18}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleClearEvent();
                  }}
                  iconColor={colors.textSecondary}
                  style={styles.eventClearBtn}
                />
              )}
              <IconButton icon="chevron-down" size={20} iconColor={colors.textSecondary} style={styles.eventChevron} />
            </View>
          </TouchableOpacity>

          {/* Event Selection Modal */}
          <RNModal
            visible={eventModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setEventModalVisible(false)}
          >
            <Pressable style={styles.eventModalOverlay} onPress={() => setEventModalVisible(false)}>
              <Pressable style={styles.eventModalContent} onPress={() => {}}>
                <View style={styles.eventModalHeader}>
                  <Text style={styles.eventModalTitle}>Select Event</Text>
                  <IconButton icon="close" size={20} onPress={() => setEventModalVisible(false)} />
                </View>
                <Divider />
                <View style={styles.eventModalSearchWrap}>
                  <Searchbar
                    placeholder="Search events..."
                    value={eventSearchQuery}
                    onChangeText={setEventSearchQuery}
                    style={styles.eventSearchBar}
                    inputStyle={styles.eventSearchInput}
                  />
                </View>
                {isLoadingEvents ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : events.length > 0 ? (
                  <ScrollView style={styles.eventList} keyboardShouldPersistTaps="handled">
                    {events.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.eventItem,
                          selectedEventId === event.id && styles.eventItemSelected,
                        ]}
                        onPress={() => {
                          handleSelectEvent(event);
                          setEventModalVisible(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.eventItemContent}>
                          <Text
                            style={[
                              styles.eventItemName,
                              selectedEventId === event.id && styles.eventItemNameSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {event.name}
                          </Text>
                          <Text style={styles.eventItemMeta}>
                            {formatDate(event.eventDate)} •{' '}
                            {event.eventCategory === 'self_event' ? 'Self' : 'Customer'}
                          </Text>
                        </View>
                        {selectedEventId === event.id && (
                          <IconButton icon="check" size={18} iconColor={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noEventsText}>No events found</Text>
                )}
                {selectedEvent && (
                  <View style={styles.eventModalFooter}>
                    <Button mode="text" onPress={() => { handleClearEvent(); setEventModalVisible(false); }}>
                      Clear Selection
                    </Button>
                  </View>
                )}
              </Pressable>
            </Pressable>
          </RNModal>

          {/* ===== Event-Based Sub-Filters (visible only when event is selected) ===== */}
          {selectedEvent && (
            <>
              <Divider style={styles.sectionDivider} />
              <Text style={styles.sectionLabel}>🔍 Event-Based Filters</Text>

              {/* Invitation Status */}
              <InvitationStatusDropdown
                value={invitationStatusId}
                onSelect={handleInvitationStatusSelect}
                label="Invitation Status"
                required={false}
                autoSelectDefault={false}
              />

              {/* Care Of */}
              <CareOfDropdown
                value={careOfId}
                onSelect={handleCareOfSelect}
                label="Care Of"
                required={false}
                autoSelectDefault={false}
              />

              {/* Gift Status */}
              <Text style={styles.filterLabel}>Gift Status</Text>
              <View style={styles.giftStatusContainer}>
                <TouchableOpacity
                  style={[
                    styles.giftStatusOption,
                    !giftStatus && styles.giftStatusOptionActive,
                  ]}
                  onPress={() => setGiftStatus(undefined)}
                >
                  <Text
                    style={[
                      styles.giftStatusText,
                      !giftStatus && styles.giftStatusTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.giftStatusOption,
                    giftStatus === 'gifted' && styles.giftStatusOptionActive,
                  ]}
                  onPress={() => setGiftStatus('gifted')}
                >
                  <Text
                    style={[
                      styles.giftStatusText,
                      giftStatus === 'gifted' && styles.giftStatusTextActive,
                    ]}
                  >
                    🎁 Gifted
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.giftStatusOption,
                    giftStatus === 'not_gifted' && styles.giftStatusOptionActive,
                  ]}
                  onPress={() => setGiftStatus('not_gifted')}
                >
                  <Text
                    style={[
                      styles.giftStatusText,
                      giftStatus === 'not_gifted' && styles.giftStatusTextActive,
                    ]}
                  >
                    ❌ Not Gifted
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        <Divider />

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.clearButton}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <Button mode="contained" onPress={handleApply} style={styles.applyButton}>
            Apply Filters
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionDivider: {
    marginVertical: spacing.md,
  },
  // Event dropdown trigger
  eventDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    minHeight: 48,
    paddingLeft: spacing.md,
  },
  eventDropdownContent: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  eventDropdownValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventDropdownMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eventDropdownPlaceholder: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  eventDropdownActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventClearBtn: {
    margin: 0,
  },
  eventChevron: {
    margin: 0,
  },
  // Event selection modal
  eventModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  eventModalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: SCREEN_HEIGHT * 0.65,
    overflow: 'hidden',
  },
  eventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  eventModalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventModalSearchWrap: {
    padding: spacing.sm,
  },
  eventSearchBar: {
    elevation: 1,
    backgroundColor: colors.background,
    height: 42,
  },
  eventSearchInput: {
    fontSize: typography.fontSize.sm,
    minHeight: 42,
  },
  loadingContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  eventList: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  eventItemContent: {
    flex: 1,
  },
  eventItemName: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventItemNameSelected: {
    color: colors.primary,
  },
  eventItemMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noEventsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  eventModalFooter: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Gift status
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  giftStatusContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  giftStatusOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  giftStatusOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  giftStatusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  giftStatusTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    borderColor: colors.border,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
