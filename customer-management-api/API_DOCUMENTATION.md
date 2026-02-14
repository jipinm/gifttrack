# Customer Management API Documentation

**Version:** 1.0.0  
**Base URL:** `http://customer-management-api.local`  
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Authentication](#1-authentication)
   - [Customers](#2-customers)
   - [Gifts](#3-gifts)
   - [Admins](#4-admins-superadmin-only)
   - [Master Data](#5-master-data)

---

## Overview

This API provides endpoints for managing customers, gifts, and admin users in a customer management system. 

### Key Features
- JWT-based authentication
- Role-based access control (Admin / Superadmin)
- Admin-scoped customer access (each admin can only view/manage their own customers)
- RESTful API design

### User Roles

| Role | Description |
|------|-------------|
| `admin` | Regular admin user. Can only manage customers they created. |
| `superadmin` | Full access to all customers and can manage admin users. |

---

## Authentication

All endpoints (except Login) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Expiration
- Tokens expire after a configured period (typically 24 hours)
- Use the Verify Token endpoint to check validity
- Use Logout to invalidate a token

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": { ... }  // Optional validation errors
}
```

---

## Error Handling

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

---

## Endpoints

---

## 1. Authentication

### 1.1 Login

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`  
**Auth Required:** No

**Request Body:**
```json
{
  "mobileNumber": "9999999999",
  "password": "Admin@123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| mobileNumber | string | Yes | 10-digit mobile number |
| password | string | Yes | User password |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Super Admin",
      "mobileNumber": "9999999999",
      "role": "superadmin",
      "branch": "Main Branch",
      "place": "Kochi"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 1.2 Verify Token

Verify if the current token is valid.

**Endpoint:** `GET /api/auth/verify`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Super Admin",
      "mobileNumber": "9999999999",
      "role": "superadmin"
    }
  }
}
```

---

### 1.3 Logout

Invalidate the current token.

**Endpoint:** `POST /api/auth/logout`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 2. Customers

> **Note:** Regular admins can only access customers they have created. Superadmins have access to all customers.

### 2.1 Get All Customers

Retrieve a list of customers with optional filtering and pagination.

**Endpoint:** `GET /api/customers`  
**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search by name or mobile number |
| giftStatus | string | No | Filter by gift status: `gifted` or `non-gifted` |
| eventDate | string | No | Filter by event date (YYYY-MM-DD) |
| districtId | integer | No | Filter by district ID |
| cityId | integer | No | Filter by city ID |
| eventTypeId | integer | No | Filter by event type ID |
| invitationStatusId | integer | No | Filter by invitation status ID |
| page | integer | No | Page number for pagination |
| perPage | integer | No | Items per page (default: 20) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "mobileNumber": "9876543210",
      "address": "123 Main Street, Apartment 4B",
      "state": {
        "id": 1,
        "name": "Kerala"
      },
      "district": {
        "id": 1,
        "name": "Ernakulam"
      },
      "city": {
        "id": 1,
        "name": "Kochi"
      },
      "eventType": {
        "id": 1,
        "name": "Wedding"
      },
      "eventDate": "2026-06-15",
      "invitationStatus": {
        "id": 2,
        "name": "Not Called"
      },
      "giftStatus": "non-gifted",
      "notes": "VIP customer",
      "giftCount": 0,
      "totalGiftValue": 0,
      "createdBy": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Admin User"
      },
      "createdAt": "2026-02-05 10:30:00"
    }
  ]
}
```

**Paginated Response (when page parameter is provided):**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "data": [...],
    "meta": {
      "total": 100,
      "perPage": 20,
      "currentPage": 1,
      "lastPage": 5,
      "from": 1,
      "to": 20
    },
    "links": {
      "first": "http://customer-management-api.local/api/customers?page=1",
      "last": "http://customer-management-api.local/api/customers?page=5",
      "prev": null,
      "next": "http://customer-management-api.local/api/customers?page=2"
    }
  }
}
```

---

### 2.2 Get Single Customer

Retrieve a single customer by ID with their gift history.

**Endpoint:** `GET /api/customers/{customerId}`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string (UUID) | Yes | Customer unique identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "mobileNumber": "9876543210",
    "address": "123 Main Street, Apartment 4B",
    "state": {
      "id": 1,
      "name": "Kerala"
    },
    "district": {
      "id": 1,
      "name": "Ernakulam"
    },
    "city": {
      "id": 1,
      "name": "Kochi"
    },
    "eventType": {
      "id": 1,
      "name": "Wedding"
    },
    "eventDate": "2026-06-15",
    "invitationStatus": {
      "id": 2,
      "name": "Not Called"
    },
    "giftStatus": "gifted",
    "notes": "VIP customer",
    "createdBy": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin User"
    },
    "createdAt": "2026-02-05 10:30:00",
    "gifts": [
      {
        "id": "gift-uuid-1",
        "eventDate": "2026-06-15",
        "giftType": {
          "id": 1,
          "name": "Cash"
        },
        "value": 5000,
        "description": "Wedding gift",
        "createdAt": "2026-06-15 14:00:00"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Customer not found"
}
```

---

### 2.3 Create Customer

Create a new customer record.

**Endpoint:** `POST /api/customers`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Test Customer",
  "mobileNumber": "9876543210",
  "address": "Test Address, Street 123",
  "stateId": 1,
  "districtId": 1,
  "cityId": 1,
  "eventTypeId": 1,
  "eventDate": "2026-06-15",
  "invitationStatusId": 2,
  "notes": "Optional notes about the customer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Customer full name |
| mobileNumber | string | Yes | 10-digit mobile number |
| address | string | Yes | Full address |
| stateId | integer | No | State ID (default: 1 - Kerala) |
| districtId | integer | Yes | District ID |
| cityId | integer | Yes | City ID |
| eventTypeId | integer | No | Event type ID |
| eventDate | string | Yes | Event date (YYYY-MM-DD format) |
| invitationStatusId | integer | No | Invitation status ID (default: 2 - Not Called) |
| notes | string | No | Additional notes |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Test Customer",
    "mobileNumber": "9876543210",
    ...
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Name is required",
    "mobileNumber": "Invalid mobile number format"
  }
}
```

---

### 2.4 Update Customer

Update an existing customer.

**Endpoint:** `PUT /api/customers/{customerId}`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string (UUID) | Yes | Customer unique identifier |

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Customer Name",
  "mobileNumber": "9876543211",
  "address": "Updated Address",
  "stateId": 1,
  "districtId": 2,
  "cityId": 3,
  "eventTypeId": 2,
  "eventDate": "2026-07-20",
  "invitationStatusId": 3,
  "notes": "Updated notes"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated Customer Name",
    ...
  }
}
```

---

### 2.5 Delete Customer

Delete a customer and all associated gifts.

**Endpoint:** `DELETE /api/customers/{customerId}`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string (UUID) | Yes | Customer unique identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 3. Gifts

> **Note:** Gift operations are restricted to customers owned by the authenticated admin. Superadmins can manage gifts for all customers.

### 3.1 Get Customer Gifts

Retrieve all gifts for a specific customer.

**Endpoint:** `GET /api/customers/{customerId}/gifts`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | string (UUID) | Yes | Customer unique identifier |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination |
| perPage | integer | No | Items per page (default: 20) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Gifts retrieved successfully",
  "data": {
    "gifts": [
      {
        "id": "gift-uuid-1",
        "customerId": "550e8400-e29b-41d4-a716-446655440001",
        "eventDate": "2026-06-15",
        "giftType": {
          "id": 1,
          "name": "Cash"
        },
        "value": 5000,
        "description": "Wedding gift",
        "createdAt": "2026-06-15 14:00:00",
        "updatedAt": "2026-06-15 14:00:00"
      }
    ],
    "totalValue": 5000,
    "count": 1
  }
}
```

---

### 3.2 Create Gift

Add a new gift for a customer.

**Endpoint:** `POST /api/gifts`  
**Auth Required:** Yes

**Request Body:**
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440001",
  "eventDate": "2026-06-15",
  "giftTypeId": 1,
  "value": 5000,
  "description": "Wedding gift"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| customerId | string (UUID) | Yes | Customer unique identifier |
| eventDate | string | Yes | Event date (YYYY-MM-DD format) |
| giftTypeId | integer | Yes | Gift type ID |
| value | number | Yes | Gift value (must be positive) |
| description | string | No | Gift description |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Gift created successfully",
  "data": {
    "id": "gift-uuid-1",
    "customerId": "550e8400-e29b-41d4-a716-446655440001",
    "eventDate": "2026-06-15",
    "giftType": {
      "id": 1,
      "name": "Cash"
    },
    "value": 5000,
    "description": "Wedding gift",
    "createdAt": "2026-06-15 14:00:00",
    "updatedAt": "2026-06-15 14:00:00"
  }
}
```

> **Note:** Creating a gift automatically updates the customer's `giftStatus` to `gifted`.

---

### 3.3 Update Gift

Update an existing gift.

**Endpoint:** `PUT /api/gifts/{giftId}`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| giftId | string (UUID) | Yes | Gift unique identifier |

**Request Body:** (all fields optional)
```json
{
  "eventDate": "2026-07-20",
  "giftTypeId": 2,
  "value": 7500,
  "description": "Updated gift description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Gift updated successfully",
  "data": {
    "id": "gift-uuid-1",
    "value": 7500,
    ...
  }
}
```

---

### 3.4 Delete Gift

Delete a gift.

**Endpoint:** `DELETE /api/gifts/{giftId}/delete`  
**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| giftId | string (UUID) | Yes | Gift unique identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Gift deleted successfully",
  "data": {
    "deleted": true,
    "giftId": "gift-uuid-1",
    "customerId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

> **Note:** If all gifts are deleted from a customer, their `giftStatus` automatically changes to `non-gifted`.

---

## 4. Admins (Superadmin Only)

> **Important:** All admin management endpoints require `superadmin` role.

### 4.1 Get All Admins

Retrieve all admin users.

**Endpoint:** `GET /api/admins` or `GET /api/admins/index`  
**Auth Required:** Yes (Superadmin)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admins retrieved successfully",
  "data": [
    {
      "id": "admin-uuid-1",
      "name": "Admin User",
      "mobileNumber": "8888888888",
      "role": "admin",
      "address": "Admin Address",
      "place": "Kochi",
      "branch": "Main Branch",
      "createdAt": "2026-01-01 10:00:00"
    }
  ]
}
```

---

### 4.2 Get Single Admin

Retrieve a single admin by ID.

**Endpoint:** `GET /api/admins/show?id={adminId}` or `GET /api/admins/{adminId}`  
**Auth Required:** Yes (Superadmin)

**Query/Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Admin unique identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin retrieved successfully",
  "data": {
    "id": "admin-uuid-1",
    "name": "Admin User",
    "mobileNumber": "8888888888",
    "role": "admin",
    "address": "Admin Address",
    "place": "Kochi",
    "branch": "Main Branch",
    "createdAt": "2026-01-01 10:00:00"
  }
}
```

---

### 4.3 Create Admin

Create a new admin user.

**Endpoint:** `POST /api/admins/create`  
**Auth Required:** Yes (Superadmin)

**Request Body:**
```json
{
  "name": "New Admin",
  "mobileNumber": "7777777777",
  "password": "Admin@123",
  "address": "Admin Address",
  "place": "Kochi",
  "branch": "Main Branch"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Admin full name |
| mobileNumber | string | Yes | 10-digit mobile number (unique) |
| password | string | Yes | Password (min 6 characters) |
| address | string | No | Admin address |
| place | string | No | Place/Location |
| branch | string | No | Branch name |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": "new-admin-uuid",
    "name": "New Admin",
    "mobileNumber": "7777777777",
    "role": "admin",
    ...
  }
}
```

---

### 4.4 Update Admin

Update an existing admin.

**Endpoint:** `PUT /api/admins/update?id={adminId}`  
**Auth Required:** Yes (Superadmin)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Admin unique identifier |

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Admin Name",
  "address": "Updated Address",
  "place": "New Place",
  "branch": "Updated Branch"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "data": {
    "id": "admin-uuid-1",
    "name": "Updated Admin Name",
    ...
  }
}
```

---

### 4.5 Delete Admin

Delete an admin user.

**Endpoint:** `DELETE /api/admins/delete?id={adminId}`  
**Auth Required:** Yes (Superadmin)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Admin unique identifier |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

---

## 5. Master Data

Master data endpoints provide reference data for dropdowns and selections. These are cached for 24 hours.

### 5.1 Get States

**Endpoint:** `GET /api/master/states`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kerala",
      "code": "KL"
    }
  ]
}
```

---

### 5.2 Get Districts

**Endpoint:** `GET /api/master/districts`  
**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| stateId | integer | No | Filter by state ID |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ernakulam",
      "state_id": 1
    },
    {
      "id": 2,
      "name": "Thiruvananthapuram",
      "state_id": 1
    }
  ]
}
```

---

### 5.3 Get Cities

**Endpoint:** `GET /api/master/cities`  
**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| districtId | integer | No | Filter by district ID |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kochi",
      "district_id": 1
    },
    {
      "id": 2,
      "name": "Aluva",
      "district_id": 1
    }
  ]
}
```

---

### 5.4 Get Event Types

**Endpoint:** `GET /api/master/event-types`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wedding"
    },
    {
      "id": 2,
      "name": "Birthday"
    },
    {
      "id": 3,
      "name": "Anniversary"
    },
    {
      "id": 4,
      "name": "Housewarming"
    }
  ]
}
```

---

### 5.5 Get Gift Types

**Endpoint:** `GET /api/master/gift-types`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cash"
    },
    {
      "id": 2,
      "name": "Gold"
    },
    {
      "id": 3,
      "name": "Silver"
    },
    {
      "id": 4,
      "name": "Electronics"
    },
    {
      "id": 5,
      "name": "Other"
    }
  ]
}
```

---

### 5.6 Get Invitation Status

**Endpoint:** `GET /api/master/invitation-status`  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Invited"
    },
    {
      "id": 2,
      "name": "Not Called"
    },
    {
      "id": 3,
      "name": "Confirmed"
    },
    {
      "id": 4,
      "name": "Declined"
    }
  ]
}
```

---

## React Native Integration Notes

### Storing the Token

After successful login, store the token securely using:
- `@react-native-async-storage/async-storage` for basic storage
- `react-native-keychain` for encrypted storage (recommended)

### API Service Example

```typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://customer-management-api.local';

const api = {
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  },

  // Auth
  login: (mobileNumber: string, password: string) =>
    api.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobileNumber, password }),
    }),

  verify: () => api.request('/api/auth/verify'),

  logout: () => api.request('/api/auth/logout', { method: 'POST' }),

  // Customers
  getCustomers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.request(`/api/customers${query}`);
  },

  getCustomer: (id: string) => api.request(`/api/customers/${id}`),

  createCustomer: (data: CustomerInput) =>
    api.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: Partial<CustomerInput>) =>
    api.request(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    api.request(`/api/customers/${id}`, { method: 'DELETE' }),

  // Gifts
  getCustomerGifts: (customerId: string) =>
    api.request(`/api/customers/${customerId}/gifts`),

  createGift: (data: GiftInput) =>
    api.request('/api/gifts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGift: (id: string, data: Partial<GiftInput>) =>
    api.request(`/api/gifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGift: (id: string) =>
    api.request(`/api/gifts/${id}/delete`, { method: 'DELETE' }),

  // Master Data
  getStates: () => api.request('/api/master/states'),
  getDistricts: (stateId?: number) => {
    const query = stateId ? `?stateId=${stateId}` : '';
    return api.request(`/api/master/districts${query}`);
  },
  getCities: (districtId?: number) => {
    const query = districtId ? `?districtId=${districtId}` : '';
    return api.request(`/api/master/cities${query}`);
  },
  getEventTypes: () => api.request('/api/master/event-types'),
  getGiftTypes: () => api.request('/api/master/gift-types'),
  getInvitationStatus: () => api.request('/api/master/invitation-status'),
};

export default api;
```

### TypeScript Types

```typescript
// types/api.ts

interface User {
  id: string;
  name: string;
  mobileNumber: string;
  role: 'admin' | 'superadmin';
  branch?: string;
  place?: string;
}

interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  address: string;
  state: { id: number; name: string };
  district: { id: number; name: string };
  city: { id: number; name: string };
  eventType: { id: number; name: string } | null;
  eventDate: string;
  invitationStatus: { id: number; name: string };
  giftStatus: 'gifted' | 'non-gifted';
  notes: string;
  giftCount?: number;
  totalGiftValue?: number;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  gifts?: Gift[];
}

interface CustomerInput {
  name: string;
  mobileNumber: string;
  address: string;
  stateId?: number;
  districtId: number;
  cityId: number;
  eventTypeId?: number;
  eventDate: string;
  invitationStatusId?: number;
  notes?: string;
}

interface Gift {
  id: string;
  customerId: string;
  eventDate: string;
  giftType: { id: number; name: string };
  value: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface GiftInput {
  customerId: string;
  eventDate: string;
  giftTypeId: number;
  value: number;
  description?: string;
}

interface MasterDataItem {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## Test Credentials

| Role | Mobile Number | Password |
|------|---------------|----------|
| Superadmin | 9999999999 | Admin@123 |
| Admin | 8888888888 | Admin@123 |

---

## Changelog

### Version 1.0.0 (February 2026)
- Initial API release
- JWT authentication
- Customer CRUD operations
- Gift management
- Admin-scoped access control
- Master data endpoints
