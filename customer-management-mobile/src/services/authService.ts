import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import { STORAGE_KEYS } from '../config/env';
import { clearAllSensitiveData } from '../utils/storage';
import type { LoginCredentials, AuthResponse, ApiResponse, UserRole, AdminRegistrationInput } from '../types';

/**
 * Check server/device clock drift using the health endpoint.
 * Logs a warning if the clocks differ by more than 60 seconds —
 * clock skew is the most common cause of tokens appearing expired immediately.
 */
async function checkClockDrift(): Promise<void> {
  try {
    const deviceNow = Math.floor(Date.now() / 1000);
    const response = await api.get<{ server_timestamp?: number }>('/api/health');
    const serverTimestamp = response.data?.server_timestamp;
    if (serverTimestamp) {
      const drift = Math.abs(deviceNow - serverTimestamp);
      if (drift > 60) {
        console.warn(
          `[ClockDrift] Server and device clocks differ by ${drift}s. ` +
          'Ensure the production server has NTP synchronisation enabled ' +
          '(e.g. sudo timedatectl set-ntp true  OR  sudo systemctl enable --now systemd-timesyncd).'
        );
      } else {
        console.log(`[ClockDrift] OK – server/device offset: ${drift}s`);
      }
    }
  } catch {
    // Non-critical – do not block authentication
  }
}

export const authService = {
  /**
   * Login user (Admin or Super Admin)
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    // Check clock drift before login – skewed clocks cause immediate token expiry
    checkClockDrift();

    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);

    if (response.success && response.data) {
      const { token, user } = response.data;
      
      // Validate token before storing
      if (typeof token === 'string' && token.length > 0) {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        console.error('Invalid token received from server');
        return {
          success: false,
          message: 'Invalid authentication response from server',
        };
      }

      // Store user data if valid
      if (user && typeof user === 'object') {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_ROLE, user.role || '');
      }
    }

    return response;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      // Call logout endpoint (optional - for server-side token invalidation)
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear ALL sensitive data (tokens, cached data, etc.)
      await clearAllSensitiveData();
    }
  },

  /**
   * Get stored auth token
   */
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Get stored user data
   */
  getUserData: async (): Promise<AuthResponse['user'] | null> => {
    try {
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Get stored user role
   */
  getUserRole: async (): Promise<UserRole | null> => {
    try {
      const role = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ROLE);
      return (role as UserRole) || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await authService.getToken();
    return !!token;
  },

  /**
   * Verify token with backend (optional)
   */
  verifyToken: async (): Promise<ApiResponse<boolean>> => {
    return await api.get<boolean>(API_ENDPOINTS.AUTH.VERIFY);
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse<null>> => {
    return await api.post<null>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Self-register as a new admin (public — no token required).
   * Account is created with status = 'pending' and requires Super Admin approval.
   */
  register: async (data: AdminRegistrationInput): Promise<ApiResponse<{ id: string; name: string; mobileNumber: string; status: string }>> => {
    return await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
  },
};
