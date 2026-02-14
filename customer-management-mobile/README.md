# Customer Management Mobile App

React Native mobile application for customer and gift management system.

## Project Structure

```
customer-management-mobile/
├── src/
│   ├── config/          # Configuration files
│   │   └── api.ts       # API endpoints and configuration
│   ├── context/         # React Context providers
│   │   └── AuthContext.tsx
│   ├── data/            # Static data
│   │   └── keralaLocations.ts
│   ├── services/        # API service layer
│   │   ├── api.ts       # Axios instance and interceptors
│   │   ├── authService.ts
│   │   ├── customerService.ts
│   │   ├── giftService.ts
│   │   └── index.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── screens/         # Screen components (to be created)
│   ├── components/      # Reusable components (to be created)
│   └── navigation/      # Navigation setup (to be created)
├── App.tsx
├── app.json
└── package.json
```

## Setup Complete ✅

The following has been configured:

### 1. Type Definitions

- Customer, Admin, Gift types
- API response types
- Auth types

### 2. Data Files

- Kerala districts and cities
- Type-safe location data

### 3. API Integration Layer

- Axios client with interceptors
- Automatic token attachment
- Error handling and retries
- Generic API methods (GET, POST, PUT, DELETE)

### 4. Services

- **authService**: Login, logout, token management
- **customerService**: CRUD operations for customers
- **giftService**: Gift management for customers

### 5. Authentication Context

- Global auth state management
- Secure token storage using expo-secure-store
- Login/logout functionality
- Auto-check authentication on app load

### 6. Dependencies Installed

- axios (HTTP client)
- expo-secure-store (secure token storage)
- @react-navigation/native (navigation)
- @react-navigation/native-stack (stack navigation)

## Configuration Required

### Update API Base URL

Edit `src/config/api.ts`:

```typescript
BASE_URL: __DEV__
  ? 'http://YOUR_LOCAL_IP/customer-management-api/api'  // Change YOUR_LOCAL_IP
  : 'https://your-production-domain.com/api',
```

**To find your local IP:**

```powershell
ipconfig
# Look for IPv4 Address under your network adapter
```

## Next Steps

### 1. Create PHP Backend API

You need to implement the following endpoints:

**Authentication:**

- `POST /api/auth/login` - Login admin/superadmin
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify JWT token

**Customers:**

- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

**Gifts:**

- `GET /api/customers/:customerId/gifts` - Get customer gifts
- `POST /api/customers/:customerId/gifts` - Add gift
- `PUT /api/gifts/:id` - Update gift
- `DELETE /api/gifts/:id` - Delete gift

**Admins (Super Admin only):**

- `GET /api/admins` - Get all admins
- `POST /api/admins` - Create admin
- `PUT /api/admins/:id` - Update admin
- `DELETE /api/admins/:id` - Delete admin

### 2. Create Mobile UI Screens

Create these screen components:

```
src/screens/
├── auth/
│   ├── LoginScreen.tsx
│   └── SuperAdminLoginScreen.tsx
├── admin/
│   ├── AdminDashboardScreen.tsx
│   ├── CustomerListScreen.tsx
│   ├── CustomerFormScreen.tsx
│   └── CustomerDetailsScreen.tsx
└── superadmin/
    ├── SuperAdminDashboardScreen.tsx
    └── AdminManagementScreen.tsx
```

### 3. Setup Navigation

Create navigation structure:

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Stack (Login screens)
// Main Stack (Dashboard, Customer screens)
```

### 4. Build UI Components

Create reusable components:

```
src/components/
├── common/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Loading.tsx
└── forms/
    └── CustomerForm.tsx
```

## Usage Examples

### Login Example

```typescript
import { useAuth } from './src/context/AuthContext';

function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = async () => {
    const result = await login('9876543210', 'password123');
    if (result.success) {
      // Navigate to dashboard
    } else {
      // Show error
      alert(result.error);
    }
  };
}
```

### Fetch Customers Example

```typescript
import { customerService } from './src/services';

async function fetchCustomers() {
  const response = await customerService.getAll();
  if (response.success) {
    console.log(response.data); // Customer[]
  } else {
    console.error(response.error);
  }
}
```

### Add Gift Example

```typescript
import { giftService } from './src/services';

async function addGift(customerId: string) {
  const response = await giftService.addGift(customerId, {
    eventDate: '2026-03-15',
    type: 'Cash',
    value: 5000,
  });

  if (response.success) {
    console.log('Gift added:', response.data);
  }
}
```

## Development

### Start Development Server

```powershell
cd E:\pwa\customer-management-mobile
npx expo start
```

### Test on Device

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. Ensure phone and PC are on same Wi-Fi

### Build for Production

```powershell
# Build APK for Android
eas build --platform android --profile preview

# Build for Google Play Store
eas build --platform android --profile production
```

## Security Notes

- ✅ Auth tokens stored in expo-secure-store (encrypted)
- ✅ Automatic token attachment to requests
- ✅ 401 handling (auto-logout on token expiry)
- ⚠️ Use HTTPS in production
- ⚠️ Implement JWT token refresh mechanism
- ⚠️ Add rate limiting on PHP backend

## Troubleshooting

### Cannot connect to API

1. Check API_CONFIG.BASE_URL in `src/config/api.ts`
2. Verify XAMPP is running
3. Test API endpoint in browser: `http://YOUR_IP/customer-management-api/api/customers`
4. Check Windows Firewall settings
5. Ensure phone and PC on same network

### "Network Error"

- Check if backend server is running
- Verify IP address is correct
- Try tunnel mode: `npx expo start --tunnel`

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper UI](https://callstack.github.io/react-native-paper/)
