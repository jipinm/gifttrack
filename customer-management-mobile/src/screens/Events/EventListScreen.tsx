/**
 * Event List Screen
 * Displays paginated list of standalone events
 * All users can view events. SuperAdmin can create/edit/delete.
 */
import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../styles/theme';
import type { Event, EventFilters, PaginatedResponse, PaginationMeta } from '../../types';
import type { EventStackParamList } from '../../navigation/EventStackNavigator';

type NavigationProp = NativeStackNavigationProp<EventStackParamList>;

const PAGE_SIZE = 20;

export default function EventListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isSuperAdmin } = useAuth();
  const isSuperAdminValue = isSuperAdmin();

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

        const currentFilters: EventFilters = {
          ...filters,
          search: searchQuery || undefined,
          eventCategory: activeCategory !== 'all' ? activeCategory : undefined,
        };

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
    [filters, searchQuery, activeCategory]
  );

  // Reload on focus — inlined fetch to avoid stale loadEvents closure
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const fetchEvents = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const currentFilters: EventFilters = {
            page: 1,
            perPage: PAGE_SIZE,
            search: searchQuery || undefined,
            eventCategory: activeCategory !== 'all' ? activeCategory : undefined,
          };

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
    }, [searchQuery, activeCategory])
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
      const nextPage = (filters.page || 1) + 1;
      setFilters((prev) => ({ ...prev, page: nextPage }));
      loadEvents(true);
    }
  }, [isLoadingMore, hasMore, isLoading, filters.page, loadEvents]);

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
        <View
          style={styles.eventCardTouchable}
          onTouchEnd={() => navigation.navigate('EventDetails', { eventId: item.id })}
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
        </View>
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

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>No events found</Text>
      <Text style={styles.emptyHint}>
        {isSuperAdminValue
          ? 'Tap + to create a new event'
          : 'Events will appear here once created by Super Admin'}
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* FAB for SuperAdmin */}
      {isSuperAdminValue && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateEvent')}
        />
      )}
    </View>
  );
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
    paddingBottom: 100,
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
    bottom: 90,
    backgroundColor: colors.primary,
  },
});
