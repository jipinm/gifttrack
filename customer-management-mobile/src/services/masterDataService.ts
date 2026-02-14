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
} from '../types';

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
  // Bulk load
  // ========================================================================

  loadAllMasterData: async () => {
    const [states, districts, cities, eventTypes, giftTypes, invitationStatus, careOfOptions] =
      await Promise.all([
        masterDataService.getStates(),
        masterDataService.getDistricts(),
        masterDataService.getCities(),
        masterDataService.getEventTypes(),
        masterDataService.getGiftTypes(),
        masterDataService.getInvitationStatus(),
        masterDataService.getCareOfOptions(),
      ]);

    return {
      states: states.data || [],
      districts: districts.data || [],
      cities: cities.data || [],
      eventTypes: eventTypes.data || [],
      giftTypes: giftTypes.data || [],
      invitationStatus: invitationStatus.data || [],
      careOfOptions: careOfOptions.data || [],
    };
  },
};
