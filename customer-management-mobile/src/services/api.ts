import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';
import { STORAGE_KEYS } from '../config/env';
import type { ApiResponse } from '../types';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
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

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Handle 401 Unauthorized - clear token and redirect to login
      if (error.response.status === 401) {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ROLE);
        // Navigation will be handled in the app
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
        errors: responseData?.errors,
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
