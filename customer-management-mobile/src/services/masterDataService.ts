/**
 * Master Data Service
 * Handles all master data API calls including CRUD for Super Admin
 */

import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type {
  ApiResponse,
  State,
  District,
  City,
  EventType,
  GiftType,
  InvitationStatus,
  CareOfOption,
  MasterDataItem,
  MasterDataCategory,
} from '../types';

// Helper to get endpoint by category
const getCategoryEndpoint = (category: MasterDataCategory): string => {
  const endpoints: Record<MasterDataCategory, string> = {
    eventTypes: API_ENDPOINTS.MASTER_DATA.EVENT_TYPES,
    giftTypes: API_ENDPOINTS.MASTER_DATA.GIFT_TYPES,
    invitationStatus: API_ENDPOINTS.MASTER_DATA.INVITATION_STATUS,
    careOfOptions: API_ENDPOINTS.MASTER_DATA.CARE_OF_OPTIONS,
  };
  return endpoints[category];
};

export const masterDataService = {
  // ========================================================================
  // Read-only endpoints (all authenticated users)
  // ========================================================================

  getStates: async (): Promise<ApiResponse<State[]>> => {
    return await api.get<State[]>(API_ENDPOINTS.MASTER_DATA.STATES);
  },

  getDistricts: async (stateId?: number): Promise<ApiResponse<District[]>> => {
    const url = stateId
      ? `${API_ENDPOINTS.MASTER_DATA.DISTRICTS}?stateId=${stateId}`
      : API_ENDPOINTS.MASTER_DATA.DISTRICTS;
    return await api.get<District[]>(url);
  },

  getCities: async (districtId?: number): Promise<ApiResponse<City[]>> => {
    const url = districtId
      ? `${API_ENDPOINTS.MASTER_DATA.CITIES}?districtId=${districtId}`
      : API_ENDPOINTS.MASTER_DATA.CITIES;
    return await api.get<City[]>(url);
  },

  getEventTypes: async (): Promise<ApiResponse<EventType[]>> => {
    return await api.get<EventType[]>(API_ENDPOINTS.MASTER_DATA.EVENT_TYPES);
  },

  getGiftTypes: async (): Promise<ApiResponse<GiftType[]>> => {
    return await api.get<GiftType[]>(API_ENDPOINTS.MASTER_DATA.GIFT_TYPES);
  },

  getInvitationStatus: async (): Promise<ApiResponse<InvitationStatus[]>> => {
    return await api.get<InvitationStatus[]>(API_ENDPOINTS.MASTER_DATA.INVITATION_STATUS);
  },

  getCareOfOptions: async (): Promise<ApiResponse<CareOfOption[]>> => {
    return await api.get<CareOfOption[]>(API_ENDPOINTS.MASTER_DATA.CARE_OF_OPTIONS);
  },

  // ========================================================================
  // CRUD endpoints (Super Admin only)
  // ========================================================================

  createEventType: async (name: string): Promise<ApiResponse<EventType>> => {
    return await api.post<EventType>(API_ENDPOINTS.MASTER_DATA.EVENT_TYPES, { name });
  },

  updateEventType: async (id: number, name: string): Promise<ApiResponse<EventType>> => {
    return await api.put<EventType>(`${API_ENDPOINTS.MASTER_DATA.EVENT_TYPES}?id=${id}`, { name });
  },

  deleteEventType: async (id: number): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.MASTER_DATA.EVENT_TYPES}?id=${id}`);
  },

  createGiftType: async (name: string): Promise<ApiResponse<GiftType>> => {
    return await api.post<GiftType>(API_ENDPOINTS.MASTER_DATA.GIFT_TYPES, { name });
  },

  updateGiftType: async (id: number, name: string): Promise<ApiResponse<GiftType>> => {
    return await api.put<GiftType>(`${API_ENDPOINTS.MASTER_DATA.GIFT_TYPES}?id=${id}`, { name });
  },

  deleteGiftType: async (id: number): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.MASTER_DATA.GIFT_TYPES}?id=${id}`);
  },

  createCareOfOption: async (name: string): Promise<ApiResponse<CareOfOption>> => {
    return await api.post<CareOfOption>(API_ENDPOINTS.MASTER_DATA.CARE_OF_OPTIONS, { name });
  },

  updateCareOfOption: async (id: number, name: string): Promise<ApiResponse<CareOfOption>> => {
    return await api.put<CareOfOption>(`${API_ENDPOINTS.MASTER_DATA.CARE_OF_OPTIONS}?id=${id}`, { name });
  },

  deleteCareOfOption: async (id: number): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.MASTER_DATA.CARE_OF_OPTIONS}?id=${id}`);
  },

  // ========================================================================
  // ========================================================================
  // Bulk load
  // ========================================================================

  loadAllMasterData: async () => {
    const [states, districts, cities, eventTypes, giftTypes, invitationStatus, careOfOptions] =
      await Promise.allSettled([
        masterDataService.getStates(),
        masterDataService.getDistricts(),
        masterDataService.getCities(),
        masterDataService.getEventTypes(),
        masterDataService.getGiftTypes(),
        masterDataService.getInvitationStatus(),
        masterDataService.getCareOfOptions(),
      ]);

    // Helper to extract data from settled promises
    const getData = <T,>(result: PromiseSettledResult<{ data?: T }>, fallback: T): T => {
      if (result.status === 'fulfilled' && result.value.data) {
        return result.value.data;
      }
      if (result.status === 'rejected') {
        console.error('Master data fetch failed:', result.reason);
      }
      return fallback;
    };

    return {
      states: getData(states, []),
      districts: getData(districts, []),
      cities: getData(cities, []),
      eventTypes: getData(eventTypes, []),
      giftTypes: getData(giftTypes, []),
      invitationStatus: getData(invitationStatus, []),
      careOfOptions: getData(careOfOptions, []),
    };
  },

  // ========================================================================
  // Admin Management - Get all (including inactive) by category
  // ========================================================================

  getAllByCategory: async (category: MasterDataCategory): Promise<ApiResponse<MasterDataItem[]>> => {
    const endpoint = getCategoryEndpoint(category);
    return await api.get<MasterDataItem[]>(`${endpoint}?all=1`);
  },

  // ========================================================================
  // Admin Management - Create by category
  // ========================================================================

  createByCategory: async (category: MasterDataCategory, name: string): Promise<ApiResponse<MasterDataItem>> => {
    const endpoint = getCategoryEndpoint(category);
    return await api.post<MasterDataItem>(endpoint, { name });
  },

  // ========================================================================
  // Admin Management - Update by category
  // ========================================================================

  updateByCategory: async (category: MasterDataCategory, id: number, name: string): Promise<ApiResponse<MasterDataItem>> => {
    const endpoint = getCategoryEndpoint(category);
    return await api.put<MasterDataItem>(`${endpoint}?id=${id}`, { name });
  },

  // ========================================================================
  // Admin Management - Toggle active status by category
  // ========================================================================

  toggleActiveByCategory: async (category: MasterDataCategory, id: number): Promise<ApiResponse<MasterDataItem>> => {
    const endpoint = getCategoryEndpoint(category);
    return await api.patch<MasterDataItem>(`${endpoint}?id=${id}`);
  },

  // ========================================================================
  // Admin Management - Set default by category
  // ========================================================================

  setDefaultByCategory: async (category: MasterDataCategory, id: number): Promise<ApiResponse<MasterDataItem>> => {
    const endpoint = getCategoryEndpoint(category);
    return await api.patch<MasterDataItem>(`${endpoint}?id=${id}&action=set-default`);
  },
};
