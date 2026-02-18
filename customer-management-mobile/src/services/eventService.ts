/**
 * Event Service
 * Handles API calls for standalone events (managed by Super Admin)
 * and event-customer attachment operations
 */
import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
import type {
  ApiResponse,
  Event,
  EventInput,
  EventFilters,
  EventCustomer,
  AttachCustomerInput,
  UpdateAttachmentInput,
  PaginatedResponse,
} from '../types';

export const eventService = {
  // ========================================================================
  // Event CRUD (Super Admin)
  // ========================================================================

  /**
   * Get all events with optional filters
   */
  getAll: async (filters?: EventFilters): Promise<ApiResponse<PaginatedResponse<Event>>> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.eventTypeId) params.append('eventTypeId', filters.eventTypeId.toString());
      if (filters.eventCategory) params.append('eventCategory', filters.eventCategory);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.timeFrame) params.append('timeFrame', filters.timeFrame);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.perPage) params.append('perPage', filters.perPage.toString());
    }
    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.EVENTS.BASE}?${queryString}`
      : API_ENDPOINTS.EVENTS.BASE;
    return await api.get<PaginatedResponse<Event>>(url);
  },

  /**
   * Get a single event by ID (with attached customers)
   */
  getById: async (eventId: string): Promise<ApiResponse<Event>> => {
    return await api.get<Event>(`${API_ENDPOINTS.EVENTS.SHOW}?id=${eventId}`);
  },

  /**
   * Create a new event (Super Admin only)
   */
  create: async (eventData: EventInput): Promise<ApiResponse<Event>> => {
    return await api.post<Event>(API_ENDPOINTS.EVENTS.BASE, eventData);
  },

  /**
   * Update an event (Super Admin only)
   */
  update: async (eventId: string, eventData: Partial<EventInput>): Promise<ApiResponse<Event>> => {
    return await api.put<Event>(`${API_ENDPOINTS.EVENTS.UPDATE}?id=${eventId}`, eventData);
  },

  /**
   * Delete an event (Super Admin only)
   */
  delete: async (eventId: string): Promise<ApiResponse<void>> => {
    return await api.delete<void>(`${API_ENDPOINTS.EVENTS.DELETE}?id=${eventId}`);
  },

  // ========================================================================
  // Event-Customer Attachments
  // ========================================================================

  /**
   * Get customers attached to an event
   */
  getEventCustomers: async (eventId: string): Promise<ApiResponse<EventCustomer[]>> => {
    return await api.get<EventCustomer[]>(
      `${API_ENDPOINTS.EVENTS.CUSTOMERS}?eventId=${eventId}`
    );
  },

  /**
   * Attach a customer to an event
   */
  attachCustomer: async (data: AttachCustomerInput): Promise<ApiResponse<EventCustomer>> => {
    return await api.post<EventCustomer>(API_ENDPOINTS.EVENTS.CUSTOMERS, data);
  },

  /**
   * Update an attachment (invitation status, care of)
   */
  updateAttachment: async (
    attachmentId: string,
    data: UpdateAttachmentInput
  ): Promise<ApiResponse<EventCustomer>> => {
    return await api.put<EventCustomer>(
      `${API_ENDPOINTS.EVENTS.UPDATE_ATTACHMENT}?id=${attachmentId}`,
      data
    );
  },

  /**
   * Detach a customer from an event (also deletes related gifts)
   */
  detachCustomer: async (attachmentId: string): Promise<ApiResponse<void>> => {
    return await api.delete<void>(
      `${API_ENDPOINTS.EVENTS.DETACH_CUSTOMER}?id=${attachmentId}`
    );
  },
};
