/**
 * Master Data Context
 * Manages and caches master data (states, districts, cities, event types, gift types, invitation status)
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { masterDataService } from '../services/masterDataService';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS, CACHE_CONFIG } from '../config/env';
import type { MasterData, MasterDataContextType, MasterDataCategory, District, City } from '../types';

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

interface MasterDataProviderProps {
  children: ReactNode;
}

export function MasterDataProvider({ children }: MasterDataProviderProps) {
  const { isAuthenticated } = useAuth();
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Load master data when authenticated
  useEffect(() => {
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadFromCache();
    }
    // Reset when logged out — clear cache so next user gets fresh data
    if (!isAuthenticated) {
      hasLoadedRef.current = false;
      setMasterData(null);
      // Clear cached master data (care-of options are user-specific)
      AsyncStorage.removeItem(STORAGE_KEYS.MASTER_DATA_CACHE).catch(() => {});
    }
  }, [isAuthenticated]);

  /**
   * Validate that cached data has all required keys
   */
  const isValidMasterData = (data: any): data is MasterData => {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.states) &&
      Array.isArray(data.districts) &&
      Array.isArray(data.cities) &&
      Array.isArray(data.eventTypes) &&
      Array.isArray(data.giftTypes) &&
      Array.isArray(data.invitationStatus) &&
      Array.isArray(data.careOfOptions)
    );
  };

  /**
   * Load master data from AsyncStorage cache
   */
  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.MASTER_DATA_CACHE);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (24 hours) AND has all required keys
        if (now - timestamp < CACHE_CONFIG.MASTER_DATA_TTL && isValidMasterData(data)) {
          setMasterData(data);
          return;
        }

        // Cache is stale or incomplete, clear it
        await AsyncStorage.removeItem(STORAGE_KEYS.MASTER_DATA_CACHE);
      }

      // Cache is invalid or doesn't exist, load from API
      await loadMasterData();
    } catch (err) {
      console.error('Failed to load master data from cache:', err);
      await loadMasterData();
    }
  };

  /**
   * Load master data from API and cache it
   */
  const loadMasterData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await masterDataService.loadAllMasterData();

      setMasterData(data);

      // Cache the data
      await AsyncStorage.setItem(
        STORAGE_KEYS.MASTER_DATA_CACHE,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load master data';
      setError(errorMessage);
      console.error('Failed to load master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh master data (clear cache and reload)
   */
  const refreshMasterData = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MASTER_DATA_CACHE);
      await loadMasterData();
    } catch (err) {
      console.error('Failed to refresh master data:', err);
      throw err;
    }
  };

  /**
   * Get districts filtered by state ID
   */
  const getDistrictsByState = (stateId: number): District[] => {
    if (!masterData) return [];
    return masterData.districts.filter((district) => district.state_id === stateId);
  };

  /**
   * Get cities filtered by district ID
   */
  const getCitiesByDistrict = (districtId: number): City[] => {
    if (!masterData) return [];
    return masterData.cities.filter((city) => city.district_id === districtId);
  };

  /**
   * Get the default item ID for a master data category
   */
  const getDefaultId = (category: MasterDataCategory): number | null => {
    if (!masterData) return null;
    const items = masterData[category];
    if (!items) return null;
    const defaultItem = items.find((item) => item.isDefault);
    return defaultItem ? defaultItem.id : null;
  };

  const value: MasterDataContextType = {
    masterData,
    isLoading,
    error,
    loadMasterData,
    refreshMasterData,
    getDistrictsByState,
    getCitiesByDistrict,
    getDefaultId,
  };

  return <MasterDataContext.Provider value={value}>{children}</MasterDataContext.Provider>;
}

// Default context value for graceful fallback
const defaultMasterDataContext: MasterDataContextType = {
  masterData: null,
  isLoading: false,
  error: null,
  loadMasterData: async () => {},
  refreshMasterData: async () => {},
  getDistrictsByState: () => [],
  getCitiesByDistrict: () => [],
  getDefaultId: () => null,
};

export function useMasterData(): MasterDataContextType {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    // Return safe defaults instead of throwing
    // This handles edge cases like hot reload, race conditions, etc.
    console.warn('useMasterData: MasterDataProvider not found, using defaults');
    return defaultMasterDataContext;
  }
  return context;
}
