/**
 * OptimizedList Component
 * A performance-optimized FlatList wrapper with common optimizations applied
 */
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '../../styles/theme';

interface OptimizedListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  estimatedItemSize?: number;
  // Performance options
  maxToRenderPerBatch?: number;
  windowSize?: number;
  initialNumToRender?: number;
  updateCellsBatchingPeriod?: number;
}

function OptimizedList<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isRefreshing = false,
  isLoadingMore = false,
  onRefresh,
  onLoadMore,
  emptyIcon = '📋',
  emptyTitle = 'No items found',
  emptySubtitle,
  estimatedItemSize,
  maxToRenderPerBatch = 10,
  windowSize = 5,
  initialNumToRender = 10,
  updateCellsBatchingPeriod = 50,
  contentContainerStyle,
  ...rest
}: OptimizedListProps<T>) {
  // Memoized render item wrapper
  const renderItemWrapper = useCallback(
    ({ item, index }: { item: T; index: number }) => renderItem(item, index),
    [renderItem]
  );

  // Memoized key extractor wrapper
  const keyExtractorWrapper = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  // Footer loader component
  const FooterLoader = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  // Empty state component
  const EmptyState = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{emptyIcon}</Text>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        {emptySubtitle && <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>}
      </View>
    );
  }, [isLoading, emptyIcon, emptyTitle, emptySubtitle]);

  // Get item layout for fixed-size items (optional)
  const getItemLayout = useMemo(() => {
    if (!estimatedItemSize) return undefined;
    return (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    });
  }, [estimatedItemSize]);

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (onLoadMore && !isLoading && !isLoadingMore) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading, isLoadingMore]);

  // Container style
  const containerStyle = useMemo(() => {
    return [data.length === 0 ? styles.emptyList : styles.list, contentContainerStyle];
  }, [data.length, contentContainerStyle]);

  // Loading state
  if (isLoading && !isRefreshing && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItemWrapper}
      keyExtractor={keyExtractorWrapper}
      contentContainerStyle={containerStyle}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={FooterLoader}
      ListEmptyComponent={EmptyState}
      showsVerticalScrollIndicator={false}
      // Performance optimizations
      removeClippedSubviews
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      initialNumToRender={initialNumToRender}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      getItemLayout={getItemLayout}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing['4xl'],
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default OptimizedList;
