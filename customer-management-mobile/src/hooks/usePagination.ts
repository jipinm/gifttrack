/**
 * usePagination Hook
 * Handles pagination state and logic for FlatLists
 */
import { useState, useCallback, useMemo } from 'react';

interface PaginationState<T> {
  data: T[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  total: number;
}

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  state: PaginationState<T>;
  setData: (data: T[], total?: number, hasMore?: boolean) => void;
  appendData: (data: T[], hasMore?: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingMore: (isLoadingMore: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;
  nextPage: () => number;
  resetPage: () => void;
  reset: () => void;
  getLoadMoreProps: () => {
    onEndReached: () => void;
    onEndReachedThreshold: number;
  };
  getRefreshProps: () => {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export function usePagination<T>(options: UsePaginationOptions = {}): UsePaginationResult<T> {
  const { initialPage = 1 } = options;
  // pageSize available in options for future use

  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    page: initialPage,
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    total: 0,
  });

  /**
   * Set initial data (replaces existing)
   */
  const setData = useCallback((data: T[], total = data.length, hasMore = true) => {
    setState((prev) => ({
      ...prev,
      data,
      total,
      hasMore,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
    }));
  }, []);

  /**
   * Append data for pagination
   */
  const appendData = useCallback((newData: T[], hasMore = true) => {
    setState((prev) => ({
      ...prev,
      data: [...prev.data, ...newData],
      hasMore,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
    }));
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  /**
   * Set loading more state
   */
  const setLoadingMore = useCallback((isLoadingMore: boolean) => {
    setState((prev) => ({ ...prev, isLoadingMore }));
  }, []);

  /**
   * Set refreshing state
   */
  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setState((prev) => ({ ...prev, isRefreshing }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
    }));
  }, []);

  /**
   * Increment page and return new page number
   */
  const nextPage = useCallback((): number => {
    let newPage = 1;
    setState((prev) => {
      newPage = prev.page + 1;
      return { ...prev, page: newPage };
    });
    return newPage;
  }, []);

  /**
   * Reset page to initial
   */
  const resetPage = useCallback(() => {
    setState((prev) => ({ ...prev, page: initialPage }));
  }, [initialPage]);

  /**
   * Reset entire state
   */
  const reset = useCallback(() => {
    setState({
      data: [],
      page: initialPage,
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      isRefreshing: false,
      error: null,
      total: 0,
    });
  }, [initialPage]);

  /**
   * Get props for FlatList onEndReached
   */
  const getLoadMoreProps = useMemo(
    () => () => ({
      onEndReached: () => {
        if (!state.isLoadingMore && !state.isLoading && state.hasMore) {
          setLoadingMore(true);
          nextPage();
        }
      },
      onEndReachedThreshold: 0.5,
    }),
    [state.isLoadingMore, state.isLoading, state.hasMore, setLoadingMore, nextPage]
  );

  /**
   * Get props for RefreshControl
   */
  const getRefreshProps = useMemo(
    () => () => ({
      refreshing: state.isRefreshing,
      onRefresh: () => {
        setRefreshing(true);
        resetPage();
      },
    }),
    [state.isRefreshing, setRefreshing, resetPage]
  );

  return {
    state,
    setData,
    appendData,
    setLoading,
    setLoadingMore,
    setRefreshing,
    setError,
    nextPage,
    resetPage,
    reset,
    getLoadMoreProps,
    getRefreshProps,
  };
}

export type { PaginationState, UsePaginationOptions, UsePaginationResult };
export default usePagination;
