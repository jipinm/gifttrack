import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Gift, GiftInput, CustomerGiftsResponse, ApiResponse } from '../types';

export const giftService = {
  /**
   * Get all gifts for a customer
   */
  getCustomerGifts: async (customerId: string): Promise<ApiResponse<CustomerGiftsResponse>> => {
    return await api.get<CustomerGiftsResponse>(
      `${API_ENDPOINTS.GIFTS.CUSTOMER_GIFTS}?customerId=${customerId}`
    );
  },

  /**
   * Create gift (requires eventId and customerId)
   */
  createGift: async (giftData: GiftInput): Promise<ApiResponse<Gift>> => {
    return await api.post<Gift>(API_ENDPOINTS.GIFTS.BASE, giftData);
  },

  /**
   * Update gift
   */
  updateGift: async (giftId: string, giftData: Partial<GiftInput>): Promise<ApiResponse<Gift>> => {
    return await api.put<Gift>(`${API_ENDPOINTS.GIFTS.UPDATE}?id=${giftId}`, giftData);
  },

  /**
   * Delete gift
   */
  deleteGift: async (giftId: string): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.GIFTS.DELETE}?id=${giftId}`);
  },
};
