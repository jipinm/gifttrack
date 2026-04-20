import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { STORAGE_KEYS } from '../config/env';
import { authEvents } from '../utils/authEvents';
import type { ApiResponse } from '../types';

// ---------------------------------------------------------------------------
// Token-expiry helpers
// ---------------------------------------------------------------------------

/** Decode the JWT payload (base64url) without verifying the signature. */
function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    // atob is available in React Native's JSC / Hermes environments
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Return true when the token will expire within the next 5 minutes
 * so we can proactively refresh before the server rejects it.
 */
function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const fiveMinutes = 5 * 60;
  return payload.exp - Date.now() / 1000 < fiveMinutes;
}

// Prevent concurrent refresh calls: one refresh, then replay queued requests
let _isRefreshing = false;
let _refreshSubscribers: Array<(newToken: string | null) => void> = [];

function subscribeToRefresh(cb: (token: string | null) => void) {
  _refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(newToken: string | null) {
  _refreshSubscribers.forEach((cb) => cb(newToken));
  _refreshSubscribers = [];
}

/** Call the /api/auth/refresh endpoint directly (bypasses apiClient to avoid loops). */
async function callRefreshEndpoint(): Promise<string | null> {
  try {
    const currentToken = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!currentToken) return null;

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    const newToken: string | undefined = response.data?.data?.token;
    if (newToken) {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - attach auth token + proactive refresh when expiring soon
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      let token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        // Proactively refresh if token expires within 5 minutes
        if (isTokenExpiringSoon(token)) {
          const refreshed = await callRefreshEndpoint();
          if (refreshed) token = refreshed;
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - reactive silent refresh on 401, then replay the request
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401 && !originalRequest._retry) {
        // If already refreshing, queue this request until refresh completes
        if (_isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeToRefresh((newToken) => {
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(apiClient(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        }

        originalRequest._retry = true;
        _isRefreshing = true;

        const newToken = await callRefreshEndpoint();
        _isRefreshing = false;

        if (newToken) {
          // Replay queued requests with the new token
          notifyRefreshSubscribers(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }

        // Refresh failed - clear stored credentials and force logout
        notifyRefreshSubscribers(null);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
        authEvents.emitUnauthorized();
      }

      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access forbidden');
      }

      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.error('Resource not found');
      }

      // Handle 500 Server Error
      if (error.response.status === 500) {
        console.error('Server error occurred');
      }
    } else if (error.request) {
      // Network error - no response received
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Type for PHP API response format
interface PhpApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

// Helper to normalize PHP API response
function normalizeResponse<T>(response: AxiosResponse): ApiResponse<T> {
  const data = response.data as PhpApiResponse<T>;
  
  // PHP API returns {success, data, message} format
  if (typeof data === 'object' && data !== null && 'success' in data) {
    return {
      success: data.success,
      data: data.data,
      message: data.message,
      errors: data.errors,
    };
  }
  
  // Fallback for non-standard responses
  return {
    success: true,
    data: response.data,
  };
}

// Generic API methods
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // POST request
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // PUT request
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // POST multipart/form-data (file uploads)
  postFormData: async <T = any>(
    url: string,
    formData: FormData
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for large file uploads
      });
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // PATCH request
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return normalizeResponse<T>(response);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Error handler
function handleApiError<T = unknown>(error: unknown): ApiResponse<T> {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ success?: boolean; message?: string; error?: string; errors?: Record<string, string> }>;

    if (axiosError.response) {
      const responseData = axiosError.response.data;
      const status = axiosError.response.status;
      
      // Log detailed error for debugging
      console.error('API Error Response:', {
        status,
        url: axiosError.config?.url,
        data: responseData,
      });
      
      // PHP API returns {success: false, error: "message"} or {success: false, message: "message"}
      let errorMessage = responseData?.error || responseData?.message || 'An error occurred';
      
      // Add status context for server errors
      if (status === 500) {
        errorMessage = `Server error: ${errorMessage}`;
      } else if (status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      }
      
      return {
        success: false,
        message: errorMessage,
        errors: responseData?.errors ?? responseData?.details,
      };
    } else if (axiosError.request) {
      // Network error
      console.error('Network Error:', axiosError.message);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
      };
    }
  }

  console.error('Unexpected Error:', error);
  return {
    success: false,
    message: 'An unexpected error occurred',
  };
}

export default apiClient;
