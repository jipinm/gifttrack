import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type {
  Customer,
  CustomerInput,
  CustomerFilters,
  CustomerEventsResponse,
  ApiResponse,
  PaginatedResponse,
} from '../types';

export const customerService = {
  /**
   * Get all customers with optional filters
   */
  getAll: async (
    filters?: CustomerFilters
  ): Promise<ApiResponse<Customer[] | PaginatedResponse<Customer>>> => {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.stateId) params.append('stateId', filters.stateId.toString());
      if (filters.districtId) params.append('districtId', filters.districtId.toString());
      if (filters.cityId) params.append('cityId', filters.cityId.toString());
      if (filters.eventId) params.append('eventId', filters.eventId);
      if (filters.eventDate) params.append('eventDate', filters.eventDate);
      if (filters.careOfId) params.append('careOfId', filters.careOfId.toString());
      if (filters.invitationStatusId) params.append('invitationStatusId', filters.invitationStatusId.toString());
      if (filters.giftStatus) params.append('giftStatus', filters.giftStatus);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.perPage) params.append('perPage', filters.perPage.toString());
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.CUSTOMERS.BASE}?${queryString}`
      : API_ENDPOINTS.CUSTOMERS.BASE;

    return await api.get<Customer[] | PaginatedResponse<Customer>>(url);
  },

  /**
   * Get customer by ID
   */
  getById: async (id: string): Promise<ApiResponse<Customer>> => {
    return await api.get<Customer>(`${API_ENDPOINTS.CUSTOMERS.SHOW}?id=${id}`);
  },

  /**
   * Create new customer
   */
  create: async (customerData: CustomerInput): Promise<ApiResponse<Customer>> => {
    return await api.post<Customer>(API_ENDPOINTS.CUSTOMERS.BASE, customerData);
  },

  /**
   * Update customer
   */
  update: async (
    id: string,
    customerData: Partial<CustomerInput>
  ): Promise<ApiResponse<Customer>> => {
    return await api.put<Customer>(`${API_ENDPOINTS.CUSTOMERS.SHOW}?id=${id}`, customerData);
  },

  /**
   * Delete customer
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.CUSTOMERS.SHOW}?id=${id}`);
  },

  /**
   * Get events associated with a customer
   */
  getCustomerEvents: async (customerId: string): Promise<ApiResponse<CustomerEventsResponse>> => {
    return await api.get<CustomerEventsResponse>(
      `${API_ENDPOINTS.CUSTOMERS.EVENTS}?customerId=${customerId}`
    );
  },
};
