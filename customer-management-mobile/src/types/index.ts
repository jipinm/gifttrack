/**
 * TypeScript Type Definitions
 * Matches the API structure - Scope Change: Standalone Events
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole = 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  mobileNumber: string;
  role: UserRole;
  branch?: string;
  place?: string;
  address?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  mobileNumber: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================================
// Master Data Types
// ============================================================================

export interface MasterDataItem {
  id: number;
  name: string;
  code?: string; // For states
  isActive?: boolean; // For admin management
  isDefault?: boolean; // For default selection
}

export interface State extends MasterDataItem {
  code: string;
}

export interface District extends MasterDataItem {
  state_id: number;
}

export interface City extends MasterDataItem {
  district_id: number;
}

export type EventType = MasterDataItem;

export type GiftType = MasterDataItem;

export type InvitationStatus = MasterDataItem;

export type CareOfOption = MasterDataItem;

// Master data category type for management screens
export type MasterDataCategory = 'eventTypes' | 'giftTypes' | 'invitationStatus' | 'careOfOptions';

export interface MasterDataCategoryConfig {
  key: MasterDataCategory;
  title: string;
  icon: string;
  endpoint: string;
}

export interface MasterData {
  states: State[];
  districts: District[];
  cities: City[];
  eventTypes: EventType[];
  giftTypes: GiftType[];
  invitationStatus: InvitationStatus[];
  careOfOptions: CareOfOption[];
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  address: string;
  state: {
    id: number;
    name: string;
  };
  district: {
    id: number;
    name: string;
  };
  city: {
    id: number;
    name: string;
  };
  notes: string;
  eventCount?: number;
  giftCount?: number;
  totalGiftValue?: number;
  createdBy: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  gifts?: Gift[];
}

export interface CustomerInput {
  name: string;
  mobileNumber: string;
  address: string;
  stateId?: number;
  districtId: number;
  cityId: number;
  notes?: string;
}

export interface CustomerFilters {
  search?: string;
  stateId?: number;
  districtId?: number;
  cityId?: number;
  eventId?: string;
  careOfId?: number;
  invitationStatusId?: number;
  giftStatus?: 'gifted' | 'not_gifted';
  page?: number;
  perPage?: number;
}

// ============================================================================
// Event Types (Standalone - managed by Super Admin)
// ============================================================================

export type EventCategory = 'self_event' | 'customer_event';
export type GiftDirection = 'received' | 'given';

export interface Event {
  id: string;
  name: string;
  eventDate: string;
  eventType: {
    id: number;
    name: string;
  };
  eventCategory: EventCategory;
  giftDirection: GiftDirection;
  notes: string | null;
  customerCount: number;
  giftCount: number;
  totalGiftValue: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  customers?: EventCustomer[];
}

export interface EventInput {
  name: string;
  eventDate: string;
  eventTypeId: number;
  eventCategory: EventCategory;
  notes?: string;
}

export interface EventFilters {
  search?: string;
  eventTypeId?: number;
  eventCategory?: EventCategory;
  dateFrom?: string;
  dateTo?: string;
  timeFrame?: 'upcoming' | 'past';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  perPage?: number;
}

// ============================================================================
// Event-Customer Attachment Types (Pivot)
// ============================================================================

export interface EventCustomer {
  id: string;
  eventId: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
    mobileNumber: string;
  };
  event?: {
    id: string;
    name: string;
    eventDate: string;
    eventCategory: EventCategory;
  };
  invitationStatus: {
    id: number;
    name: string;
  };
  careOf: {
    id: number;
    name: string;
  } | null;
  giftDirection: GiftDirection;
  giftCount: number;
  totalGiftValue: number;
  attachedBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface AttachCustomerInput {
  eventId: string;
  customerId: string;
  invitationStatusId?: number;
  careOfId?: number;
}

export interface UpdateAttachmentInput {
  invitationStatusId?: number;
  careOfId?: number;
}

// ============================================================================
// Gift Types
// ============================================================================

export interface Gift {
  id: string;
  eventId: string;
  customerId: string;
  eventName?: string;
  eventCategory?: EventCategory;
  direction?: GiftDirection;
  giftType: {
    id: number;
    name: string;
  };
  eventType?: {
    id: number;
    name: string;
  } | null;
  value: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface GiftInput {
  eventId: string;
  customerId: string;
  giftTypeId: number;
  value: number;
  description?: string;
}

export interface CustomerGiftsResponse {
  gifts: Gift[];
  totalValue: number;
  count: number;
}

// ============================================================================
// Admin Types (Superadmin only)
// ============================================================================

export interface Admin {
  id: string;
  name: string;
  mobileNumber: string;
  role: 'admin';
  address?: string;
  stateId?: number;
  districtId?: number;
  cityId?: number;
  stateName?: string;
  districtName?: string;
  cityName?: string;
  branch?: string;
  createdAt: string;
}

export interface AdminInput {
  name: string;
  mobileNumber: string;
  password: string;
  address: string;
  stateId: number;
  districtId: number;
  cityId: number;
  branch?: string;
}

export interface AdminUpdateInput {
  name?: string;
  address?: string;
  stateId?: number;
  districtId?: number;
  cityId?: number;
  branch?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

// ============================================================================
// Context Types
// ============================================================================

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export interface MasterDataContextType {
  masterData: MasterData | null;
  isLoading: boolean;
  error: string | null;
  loadMasterData: () => Promise<void>;
  refreshMasterData: () => Promise<void>;
  getDistrictsByState: (stateId: number) => District[];
  getCitiesByDistrict: (districtId: number) => City[];
  getDefaultId: (category: MasterDataCategory) => number | null;
}

// ============================================================================
// Utility Types
// ============================================================================

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}
