/**
 * Customer List Screen
 * Displays paginated customer list with search and filters
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, FAB, ActivityIndicator, Badge, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { customerService } from '../../services/customerService';
import { CustomerCard, CustomerSearchBar, CustomerFilters } from '../../components/Customers';
import { colors, spacing } from '../../styles/theme';
import type { Customer, CustomerFilters as FilterType, PaginatedResponse } from '../../types';
import type { CustomerStackParamList } from '../../navigation/CustomerStackNavigator';

type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

const PAGE_SIZE = 20;

export default function CustomerListScreen() {
  const navigation = useNavigation<NavigationProp>();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    page: 1,
    perPage: PAGE_SIZE,
  });
  const [hasMore, setHasMore] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Track if this is the first render to skip duplicate load
  const isFirstRender = useRef(true);
  const lastLoadTime = useRef(0);

  // Count active filters (excluding search, page, perPage)
  const activeFilterCount = [
    filters.stateId,
    filters.districtId,
    filters.cityId,
  ].filter(Boolean).length;

  // Load customers
  const loadCustomers = useCallback(
    async (append = false) => {
      try {
        if (!append) {
          setIsLoading(true);
        }
        setError(null);

        const response = await customerService.getAll(filters);

        if (response.success && response.data) {
          // Check if response is paginated
          if ('data' in response.data && 'meta' in response.data) {
            const paginatedData = response.data as PaginatedResponse<Customer>;
            if (append) {
              setCustomers((prev) => [...prev, ...paginatedData.data]);
            } else {
              setCustomers(paginatedData.data);
            }
            setTotalCount(paginatedData.meta.total);
            setHasMore(paginatedData.meta.currentPage < paginatedData.meta.lastPage);
          } else {
            // Non-paginated response
            const data = response.data as Customer[];
            setCustomers(append ? [...customers, ...data] : data);
            setTotalCount(data.length);
            setHasMore(false);
          }
        } else {
          setError(response.message || 'Failed to load customers');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [filters, customers]
  );

  // Initial load and filter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastLoadTime.current = Date.now();
    }
    loadCustomers();
  }, [filters]);

  // Refresh when screen comes back into focus (e.g., after adding a gift)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if at least 500ms have passed since last load
      // This prevents double-loading on initial render
      const now = Date.now();
      if (now - lastLoadTime.current > 500) {
        lastLoadTime.current = now;
        setFilters((prev) => ({ ...prev, page: 1 }));
      }
    }, [])
  );

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
    }
  }, [isLoadingMore, hasMore, isLoading]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query || undefined, page: 1 }));
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback((newFilters: FilterType) => {
    setFilters(newFilters);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({ page: 1, perPage: PAGE_SIZE });
  }, []);

  // Navigate to customer details
  const handleCustomerPress = useCallback(
    (customer: Customer) => {
      navigation.navigate('CustomerDetails', { customerId: customer.id });
    },
    [navigation]
  );

  // Navigate to create customer
  const handleAddCustomer = useCallback(() => {
    navigation.navigate('CreateCustomer');
  }, [navigation]);

  // Render customer item
  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <CustomerCard customer={item} onPress={handleCustomerPress} />
    ),
    [handleCustomerPress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Customer) => item.id, []);

  // Footer loader
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  // Empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>
          {filters.search || activeFilterCount > 0 ? 'No customers found' : 'No customers yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {filters.search || activeFilterCount > 0
            ? 'Try adjusting your search or filters'
            : 'Tap the + button to add your first customer'}
        </Text>
      </View>
    );
  }, [isLoading, filters.search, activeFilterCount]);

  // Header with filter button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <IconButton
            icon="filter-variant"
            onPress={() => setFilterModalVisible(true)}
            iconColor={activeFilterCount > 0 ? colors.white : colors.white}
          />
          {activeFilterCount > 0 && (
            <Badge style={styles.filterBadge} size={16}>
              {activeFilterCount}
            </Badge>
          )}
        </View>
      ),
    });
  }, [navigation, activeFilterCount]);

  // Error state
  if (error && !isRefreshing && customers.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryButton} onPress={() => loadCustomers()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <CustomerSearchBar value={filters.search ?? ''} onSearch={handleSearch} />

      {/* Results count */}
      {!isLoading && customers.length > 0 && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {totalCount} customer{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Loading state */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        /* Customer List */
        <FlatList
          data={customers}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={customers.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      )}

      {/* FAB - Add Customer */}
      <FAB icon="plus" style={styles.fab} onPress={handleAddCustomer} color={colors.white} />

      {/* Filter Modal */}
      <CustomerFilters
        visible={filterModalVisible}
        onDismiss={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
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
  headerRight: {
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.primary,
  },
  resultsBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
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
  retryButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.primary,
  },
});
