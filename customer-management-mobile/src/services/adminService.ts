/**
 * Admin Service
 * Handles admin user management (Superadmin only)
 */

import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type { ApiResponse, Admin, AdminInput, AdminUpdateInput, AdminDeletionRequest, DeletionRequestStatus, DeletionRequestAction, RegistrationRequestStatus, RegistrationRequestAction } from '../types';

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

  // ── Deletion Requests ────────────────────────────────────────────────────

  /**
   * Submit an account deletion request (Admin only)
   */
  requestDeletion: async (): Promise<ApiResponse<AdminDeletionRequest>> => {
    return await api.post<AdminDeletionRequest>(API_ENDPOINTS.ADMINS.DELETION_REQUESTS.CREATE, {});
  },

  /**
   * Get all deletion requests (Superadmin only)
   * @param status Optional filter: 'pending' | 'approved' | 'rejected'
   */
  getDeletionRequests: async (status?: DeletionRequestStatus): Promise<ApiResponse<AdminDeletionRequest[]>> => {
    const url = status
      ? `${API_ENDPOINTS.ADMINS.DELETION_REQUESTS.INDEX}?status=${status}`
      : API_ENDPOINTS.ADMINS.DELETION_REQUESTS.INDEX;
    return await api.get<AdminDeletionRequest[]>(url);
  },

  /**
   * Approve or reject a deletion request (Superadmin only)
   */
  actOnDeletionRequest: async (requestId: number, action: DeletionRequestAction): Promise<ApiResponse<AdminDeletionRequest>> => {
    return await api.put<AdminDeletionRequest>(
      `${API_ENDPOINTS.ADMINS.DELETION_REQUESTS.UPDATE}?id=${requestId}`,
      { action }
    );
  },

  // ── Registration Requests ────────────────────────────────────────────────

  /**
   * Get all admin registration requests (Superadmin only)
   * @param status Optional filter: 'pending' | 'approved' | 'rejected' | 'all'
   */
  getRegistrationRequests: async (status?: RegistrationRequestStatus | 'all'): Promise<ApiResponse<Admin[]>> => {
    const param = status && status !== 'all' ? `?status=${status}` : status === 'all' ? '?status=all' : '';
    return await api.get<Admin[]>(`${API_ENDPOINTS.ADMINS.REGISTRATION_REQUESTS.INDEX}${param}`);
  },

  /**
   * Approve or reject an admin registration request (Superadmin only)
   */
  actOnRegistrationRequest: async (userId: string, action: RegistrationRequestAction): Promise<ApiResponse<Admin>> => {
    return await api.put<Admin>(
      `${API_ENDPOINTS.ADMINS.REGISTRATION_REQUESTS.UPDATE}?id=${userId}`,
      { action }
    );
  },
};
