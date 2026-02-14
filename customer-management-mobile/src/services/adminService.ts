/**
 * Admin Service
 * Handles admin user management (Superadmin only)
 */

import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { ApiResponse, Admin, AdminInput, AdminUpdateInput } from '../types';

export const adminService = {
  /**
   * Get all admins (Superadmin only)
   */
  getAll: async (): Promise<ApiResponse<Admin[]>> => {
    return await api.get<Admin[]>(API_ENDPOINTS.ADMINS.BASE);
  },

  /**
   * Get admin by ID (Superadmin only)
   */
  getById: async (id: string): Promise<ApiResponse<Admin>> => {
    return await api.get<Admin>(`${API_ENDPOINTS.ADMINS.SHOW}?id=${id}`);
  },

  /**
   * Create new admin (Superadmin only)
   */
  create: async (adminData: AdminInput): Promise<ApiResponse<Admin>> => {
    return await api.post<Admin>(API_ENDPOINTS.ADMINS.CREATE, adminData);
  },

  /**
   * Update admin (Superadmin only)
   */
  update: async (id: string, adminData: AdminUpdateInput): Promise<ApiResponse<Admin>> => {
    return await api.put<Admin>(`${API_ENDPOINTS.ADMINS.UPDATE}?id=${id}`, adminData);
  },

  /**
   * Delete admin (Superadmin only)
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.ADMINS.DELETE}?id=${id}`);
  },
};
