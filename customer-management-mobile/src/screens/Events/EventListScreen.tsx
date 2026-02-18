/**
 * Event List Screen
 * Displays paginated list of standalone events
 * Supports Past/Upcoming toggle, date range filter, category filter, search
 * All users can view events. SuperAdmin can create/edit/delete.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, FAB, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { Event, EventFilters, PaginatedResponse, PaginationMeta } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList>;
type TimeFrame = 'upcoming' | 'past';

const PAGE_SIZE = 20;
/** Height of the bottom tab bar (excluding safe-area inset). Must stay in sync with MainTabNavigator. */
const TAB_BAR_BASE_HEIGHT = 70;

export default function EventListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isSuperAdmin } = useAuth();
  const isSuperAdminValue = isSuperAdmin();
  const insets = useSafeAreaInsets();

  // Derived bottom offset so FAB & list clear the absolutely-positioned tab bar
  const bottomBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    perPage: PAGE_SIZE,
  });
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'self_event' | 'customer_event'>('all');

  // Time-frame toggle (default: upcoming)
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>('upcoming');

  // Date-range filter
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  /**
   * Which picker is currently open ('from' | 'to' | null).
   * Using a single value ensures only one picker is shown at a time.
   */
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);
  /**
   * The working Date value inside the active picker.
   * Kept in separate state so the picker always has a valid (non-null) Date
   * and we can commit it only when the user confirms (Done / Android OK).
   */
  const [pickerWorkingDate, setPickerWorkingDate] = useState<Date>(new Date());

  /** Build the filter payload sent to the API */
  const buildFilters = useCallback(
    (page = 1): EventFilters => {
      const f: EventFilters = {
        page,
        perPage: PAGE_SIZE,
        search: searchQuery || undefined,
        eventCategory: activeCategory !== 'all' ? activeCategory : undefined,
      };

      if (dateFrom || dateTo) {
        // Date-range mode: chronological, ignore timeFrame auto-filter
        if (dateFrom) f.dateFrom = formatISODate(dateFrom);
        if (dateTo) f.dateTo = formatISODate(dateTo);
        f.sortOrder = 'ASC'; // chronological within range
      } else {
        // Normal time-frame mode
        f.timeFrame = activeTimeFrame;
        f.sortOrder = activeTimeFrame === 'upcoming' ? 'ASC' : 'DESC';
      }

      return f;
    },
    [searchQuery, activeCategory, activeTimeFrame, dateFrom, dateTo],
  );

  /**
   * Normalise the API response into the shape the list code expects.
   * The PHP API returns:  { events: Event[], pagination: { current_page, per_page, total, total_pages, … } }
   * We need:              { data: Event[], meta: { currentPage, perPage, total, lastPage, from, to } }
   */
  const normalizeEventResponse = useCallback((raw: any): { data: Event[]; meta: PaginationMeta } | null => {
    if (!raw) return null;

    // Already in expected shape?
    if (Array.isArray(raw.data) && raw.meta) {
      return raw as { data: Event[]; meta: PaginationMeta };
    }

    // API shape: { events, pagination }
    const events: Event[] = Array.isArray(raw.events) ? raw.events : (Array.isArray(raw) ? raw : []);
    const pg = raw.pagination;

    if (pg) {
      return {
        data: events,
        meta: {
          total: pg.total ?? 0,
          perPage: pg.per_page ?? PAGE_SIZE,
          currentPage: pg.current_page ?? 1,
          lastPage: pg.total_pages ?? 1,
          from: pg.from ?? 0,
          to: pg.to ?? 0,
        },
      };
    }

    // Non-paginated: just { events, count }
    return {
      data: events,
      meta: {
        total: events.length,
        perPage: PAGE_SIZE,
        currentPage: 1,
        lastPage: 1,
        from: events.length > 0 ? 1 : 0,
        to: events.length,
      },
    };
  }, []);

  // Load events
  const loadEvents = useCallback(
    async (append = false) => {
      try {
        if (!append) setIsLoading(true);
        setError(null);

        const page = append ? (filters.page || 1) + 1 : 1;
        const currentFilters = buildFilters(page);

        const response = await eventService.getAll(currentFilters);

        if (response.success && response.data) {
          const normalized = normalizeEventResponse(response.data);
          if (normalized && normalized.data.length >= 0) {
            if (append) {
              setEvents((prev) => [...prev, ...normalized.data]);
            } else {
              setEvents(normalized.data);
            }
            setFilters((prev) => ({ ...prev, page: normalized.meta.currentPage }));
            setTotalCount(normalized.meta.total);
            setHasMore(normalized.meta.currentPage < normalized.meta.lastPage);
          } else {
            if (!append) setEvents([]);
            setHasMore(false);
          }
        } else {
          setError(response.message || 'Failed to load events');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [filters.page, buildFilters, normalizeEventResponse],
  );

  // Reload on focus — inlined fetch to avoid stale loadEvents closure
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const fetchEvents = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const currentFilters = buildFilters(1);

          const response = await eventService.getAll(currentFilters);

          if (cancelled) return;

          if (response.success && response.data) {
            const normalized = normalizeEventResponse(response.data);
            if (normalized && normalized.data.length >= 0) {
              setEvents(normalized.data);
              setTotalCount(normalized.meta.total);
              setHasMore(normalized.meta.currentPage < normalized.meta.lastPage);
              setFilters((prev) => ({ ...prev, page: 1 }));
            } else {
              setEvents([]);
              setHasMore(false);
            }
          } else {
            setError(response.message || 'Failed to load events');
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'An error occurred');
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
          }
        }
      };

      fetchEvents();

      return () => {
        cancelled = true;
      };
    }, [searchQuery, activeCategory, activeTimeFrame, dateFrom, dateTo]),
  );

  // Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadEvents();
  }, [loadEvents]);

  // Load more
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      loadEvents(true);
    }
  }, [isLoadingMore, hasMore, isLoading, loadEvents]);

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

  // Render event card
  const renderEventCard = useCallback(
    ({ item }: { item: Event }) => (
      <View style={styles.eventCard}>
        <TouchableOpacity
          style={styles.eventCardTouchable}
          onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
          activeOpacity={0.7}
        >
          <View style={styles.eventCardHeader}>
            <View style={styles.eventCardTitle}>
              <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.eventDate}>{formatDate(item.eventDate)}</Text>
            </View>
            <View style={[
              styles.categoryBadge,
              item.eventCategory === 'self_event' ? styles.selfBadge : styles.customerBadge,
            ]}>
              <Text style={styles.categoryText}>
                {item.eventCategory === 'self_event' ? 'Self' : 'Customer'}
              </Text>
            </View>
          </View>

          <View style={styles.eventCardBody}>
            <View style={styles.eventStat}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>{item.eventType.name}</Text>
            </View>
            <View style={styles.eventStat}>
              <Text style={styles.statLabel}>Customers</Text>
              <Text style={styles.statValue}>{item.customerCount ?? 0}</Text>
            </View>
            <View style={styles.eventStat}>
              <Text style={styles.statLabel}>Gifts</Text>
              <Text style={styles.statValue}>{item.giftCount ?? 0}</Text>
            </View>
            <View style={styles.eventStat}>
              <Text style={styles.statLabel}>Value</Text>
              <Text style={[styles.statValue, styles.valueText]}>
                {formatCurrency(item.totalGiftValue)}
              </Text>
            </View>
          </View>

          <View style={styles.directionRow}>
            <Text style={styles.directionLabel}>
              {item.giftDirection === 'received' ? '📥 Gifts Received' : '📤 Gifts Given'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    ),
    [navigation]
  );

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Category filter handler
  const handleCategoryFilter = useCallback((category: 'all' | 'self_event' | 'customer_event') => {
    setActiveCategory(category);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Time-frame toggle handler
  const handleTimeFrameChange = useCallback((tf: TimeFrame) => {
    setActiveTimeFrame(tf);
    // Clear date-range when switching time-frame tabs
    setDateFrom(null);
    setDateTo(null);
    setShowDateFilter(false);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Clear date range
  const handleClearDateFilter = useCallback(() => {
    setDateFrom(null);
    setDateTo(null);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  /** Open a picker, initialising its working value to the current committed date or today */
  const openPicker = useCallback(
    (which: 'from' | 'to') => {
      const initial = which === 'from'
        ? (dateFrom ?? new Date())
        : (dateTo ?? new Date());
      setPickerWorkingDate(initial);
      setActivePicker(which);
    },
    [dateFrom, dateTo],
  );

  /** iOS: called on every spinner scroll — just update working value, do NOT commit yet */
  /** Android: called once with type 'set' or 'dismissed' */
  const handlePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        // Android picker closes itself after a choice
        setActivePicker(null);
        if (event.type === 'set' && selectedDate) {
          if (activePicker === 'from') {
            setDateFrom(selectedDate);
          } else {
            setDateTo(selectedDate);
          }
          setFilters((prev) => ({ ...prev, page: 1 }));
        }
        // 'dismissed' → no change, picker already closed
      } else {
        // iOS spinner fires type 'change' on every scroll — keep working value in sync
        if (selectedDate) {
          setPickerWorkingDate(selectedDate);
        }
      }
    },
    [activePicker],
  );

  /** iOS only: user pressed 'Done' — commit the working value */
  const handlePickerDone = useCallback(() => {
    if (activePicker === 'from') {
      setDateFrom(pickerWorkingDate);
    } else {
      setDateTo(pickerWorkingDate);
    }
    setActivePicker(null);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, [activePicker, pickerWorkingDate]);

  /** iOS only: user pressed 'Cancel' — discard working value */
  const handlePickerCancel = useCallback(() => {
    setActivePicker(null);
  }, []);

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>
        {(dateFrom || dateTo)
          ? 'No events in selected date range'
          : activeTimeFrame === 'upcoming'
            ? 'No upcoming events'
            : 'No past events'}
      </Text>
      <Text style={styles.emptyHint}>
        Tap + to create a new event
      </Text>
    </View>
  );

  // Footer loader
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Whether date range is active (overrides timeFrame)
  const isDateRangeActive = !!(dateFrom || dateTo);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search events..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
      </View>

      {/* ── Time-frame toggle (Upcoming / Past) + Date filter button ── */}
      <View style={styles.timeFrameContainer}>
        <View style={styles.timeFrameToggle}>
          <TouchableOpacity
            style={[
              styles.timeFrameTab,
              activeTimeFrame === 'upcoming' && !isDateRangeActive && styles.timeFrameTabActive,
            ]}
            onPress={() => handleTimeFrameChange('upcoming')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeFrameText,
                activeTimeFrame === 'upcoming' && !isDateRangeActive && styles.timeFrameTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFrameTab,
              activeTimeFrame === 'past' && !isDateRangeActive && styles.timeFrameTabActive,
            ]}
            onPress={() => handleTimeFrameChange('past')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.timeFrameText,
                activeTimeFrame === 'past' && !isDateRangeActive && styles.timeFrameTextActive,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date-range toggle button */}
        <TouchableOpacity
          style={[styles.dateFilterToggle, showDateFilter && styles.dateFilterToggleActive]}
          onPress={() => setShowDateFilter((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateFilterToggleIcon}>📅</Text>
          <Text
            style={[
              styles.dateFilterToggleText,
              (showDateFilter || isDateRangeActive) && styles.dateFilterToggleTextActive,
            ]}
          >
            {isDateRangeActive ? 'Dates ●' : 'Dates'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Date-range filter (collapsible) ── */}
      {showDateFilter && (
        <View style={styles.dateRangeContainer}>
          <View style={styles.dateRangeRow}>
            {/* From Date */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                activePicker === 'from' && styles.datePickerButtonActive,
              ]}
              onPress={() => openPicker('from')}
              activeOpacity={0.7}
            >
              <Text style={styles.datePickerLabel}>From</Text>
              <Text style={[styles.datePickerValue, !dateFrom && styles.datePickerPlaceholder]}>
                {dateFrom ? formatDate(dateFrom.toISOString()) : 'Select'}
              </Text>
            </TouchableOpacity>

            {/* To Date */}
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                activePicker === 'to' && styles.datePickerButtonActive,
              ]}
              onPress={() => openPicker('to')}
              activeOpacity={0.7}
            >
              <Text style={styles.datePickerLabel}>To</Text>
              <Text style={[styles.datePickerValue, !dateTo && styles.datePickerPlaceholder]}>
                {dateTo ? formatDate(dateTo.toISOString()) : 'Select'}
              </Text>
            </TouchableOpacity>

            {/* Clear */}
            {isDateRangeActive && (
              <TouchableOpacity
                style={styles.dateClearButton}
                onPress={handleClearDateFilter}
                activeOpacity={0.7}
              >
                <Text style={styles.dateClearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Native date picker — only one shown at a time */}
          {activePicker !== null && (
            <>
              {/* iOS: show Done / Cancel bar above the spinner */}
              {Platform.OS === 'ios' && (
                <View style={styles.iosPickerToolbar}>
                  <TouchableOpacity onPress={handlePickerCancel} activeOpacity={0.7}>
                    <Text style={styles.iosPickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>
                    {activePicker === 'from' ? 'Select From Date' : 'Select To Date'}
                  </Text>
                  <TouchableOpacity onPress={handlePickerDone} activeOpacity={0.7}>
                    <Text style={styles.iosPickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
              <DateTimePicker
                value={pickerWorkingDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                minimumDate={activePicker === 'to' && dateFrom ? dateFrom : undefined}
                maximumDate={activePicker === 'from' && dateTo ? dateTo : undefined}
              />
            </>
          )}
        </View>
      )}

      {/* Category Filter Chips */}
      <View style={styles.chipContainer}>
        <Chip
          selected={activeCategory === 'all'}
          onPress={() => handleCategoryFilter('all')}
          style={styles.chip}
          compact
        >
          All
        </Chip>
        <Chip
          selected={activeCategory === 'self_event'}
          onPress={() => handleCategoryFilter('self_event')}
          style={styles.chip}
          compact
        >
          Self Events
        </Chip>
        <Chip
          selected={activeCategory === 'customer_event'}
          onPress={() => handleCategoryFilter('customer_event')}
          style={styles.chip}
          compact
        >
          Customer Events
        </Chip>
      </View>

      {/* Total Count */}
      {totalCount > 0 && (
        <Text style={styles.totalCount}>{totalCount} event{totalCount !== 1 ? 's' : ''}</Text>
      )}

      {/* Loading State */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomBarHeight + 24 }]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* FAB for adding events (Admin and SuperAdmin) */}
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: bottomBarHeight + 16 }]}
        onPress={() => navigation.navigate('CreateEvent')}
      />
    </View>
  );
}

/** Format a Date object to YYYY-MM-DD for the API */
function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.sm,
    paddingBottom: 0,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    elevation: 1,
  },
  searchInput: {
    fontSize: typography.fontSize.sm,
  },

  // ── Time-frame toggle ──────────────────────────────────────────────
  timeFrameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  timeFrameToggle: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: 3,
  },
  timeFrameTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md - 2,
  },
  timeFrameTabActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  timeFrameText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeFrameTextActive: {
    color: colors.white,
  },
  dateFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  dateFilterToggleActive: {
    backgroundColor: colors.primaryLight,
  },
  dateFilterToggleIcon: {
    fontSize: 14,
  },
  dateFilterToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateFilterToggleTextActive: {
    color: colors.primaryDark,
  },

  // ── Date-range filter ──────────────────────────────────────────────
  dateRangeContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  datePickerButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight ?? '#DBEAFE',
  },
  datePickerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  datePickerValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  datePickerPlaceholder: {
    color: colors.textDisabled,
    fontWeight: '400',
  },
  dateClearButton: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 4,
    borderRadius: borderRadius.md,
  },
  dateClearText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.error,
  },

  // ── Category chips ─────────────────────────────────────────────────
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
  },
  totalCount: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
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
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.sm,
    // paddingBottom is set dynamically via inline style using bottomBarHeight
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  eventCardTouchable: {
    padding: spacing.md,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventCardTitle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  eventName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  categoryText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  eventStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  valueText: {
    color: colors.success,
  },
  directionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  directionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    // bottom is set dynamically via inline style using bottomBarHeight
    backgroundColor: colors.primary,
  },

  // ── iOS picker toolbar ─────────────────────────────────────────────
  iosPickerToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  iosPickerCancel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  iosPickerTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  iosPickerDone: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});
