# API Integration Setup Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [Environment Configuration](#environment-configuration)
3. [Project Structure](#project-structure)
4. [Implementation Steps](#implementation-steps)
5. [Authentication Flow](#authentication-flow)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Installation

### 1. Install Dependencies

```bash
cd c:\Users\TOAN\Desktop\HCMVison-fe

# Install axios for HTTP requests
npm install axios

# Install AsyncStorage for token persistence
npx expo install expo-secure-store

# Install other required dependencies if missing
npm install @react-native-async-storage/async-storage
```

### 2. Verify Installation

```bash
npm list axios expo-secure-store @react-native-async-storage/async-storage
```

---

## Environment Configuration

### 1. Create `.env.local` file

```bash
# .env.local (in project root)
EXPO_PUBLIC_API_URL=https://hcmvision-api.onrender.com/api
EXPO_PUBLIC_ENV=production
```

### 2. Update `app.json` if needed

Add environment variables configuration:

```json
{
  "expo": {
    "plugins": [
      "expo-secure-store"
    ]
  }
}
```

### 3. Update TypeScript Config

Make sure `tsconfig.json` includes types:

```json
{
  "compilerOptions": {
    "types": ["node", "react", "react-native", "expo"]
  }
}
```

---

## Project Structure

After integration, your project should look like:

```
src/
├── services/
│   └── api.ts                 # API client (CREATED)
├── types/
│   └── api.ts                 # Type definitions (CREATED)
├── hooks/                      # Custom hooks (optional)
│   ├── useAuth.ts             # (TO CREATE)
│   ├── useCamera.ts           # (TO CREATE)
│   └── useWeather.ts          # (TO CREATE)
├── app/
│   ├── login.tsx              # (MODIFY)
│   ├── register.tsx           # (MODIFY)
│   ├── cameras.tsx            # (MODIFY)
│   ├── camera-detail.tsx      # (MODIFY)
│   ├── rain-list.tsx          # (MODIFY)
│   ├── rain-heatmap.tsx       # (MODIFY)
│   ├── route.tsx              # (MODIFY)
│   └── admin/
│       ├── dashboard.tsx      # (MODIFY)
│       ├── manage-cameras.tsx # (MODIFY)
│       ├── manage-users.tsx   # (MODIFY)
│       └── system-health.tsx  # (MODIFY)
└── constants/
    └── api.ts                 # (TO CREATE - API constants)
```

---

## Implementation Steps

### Phase 1: Setup API Client & Auth (Week 1)

#### Step 1.1: Copy API Files
```bash
# Files already created:
# - src/services/api.ts (API client)
# - src/types/api.ts (Type definitions)
```

#### Step 1.2: Create Auth Hook

File: `src/hooks/useAuth.ts`

```typescript
import { useContext, createContext, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Provider component to be used in App.tsx or root layout
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Implementation...
}
```

#### Step 1.3: Integrate Login Screen

File: `src/app/login.tsx`

Use the example from `EXAMPLES_LOGIN_INTEGRATION.tsx`

#### Step 1.4: Integrate Register Screen

Similar to login, implement registration with `apiClient.register()`

---

### Phase 2: Camera Management (Week 2)

#### Step 2.1: Create Camera Hook

File: `src/hooks/useCamera.ts`

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Camera, CameraListResponse } from '@/types/api';

export const useCamera = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCameras = useCallback(
    async (search?: string, page = 1, pageSize = 10) => {
      try {
        setLoading(true);
        const response = await apiClient.getCameras(search, undefined, page, pageSize);
        const data = response.data as CameraListResponse;
        setCameras(page === 1 ? data.items : (prev) => [...prev, ...data.items]);
        return data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to load cameras';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { cameras, loading, error, getCameras };
};
```

#### Step 2.2: Integrate Cameras Screen

File: `src/app/cameras.tsx`

Use the example from `EXAMPLES_CAMERAS_INTEGRATION.tsx`

#### Step 2.3: Integrate Camera Detail Screen

File: `src/app/camera-detail.tsx`

```typescript
// Similar pattern:
// 1. Get camera details from route params
// 2. Load additional data (favorite status)
// 3. Provide options to:
//    - View camera stream
//    - Add/remove from favorites
//    - Upload demo image (admin)
//    - View recent weather logs
```

---

### Phase 3: Weather & Traffic (Week 3)

#### Step 3.1: Create Weather Hook

File: `src/hooks/useWeather.ts`

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { WeatherData, WeatherLog, RainingCamera } from '@/types/api';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLatestWeather();
      setWeather(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeatherLogs = useCallback(
    async (minutes = 180, limit = 100) => {
      try {
        const response = await apiClient.getWeatherLogs(minutes, limit);
        setLogs(response.data.items);
      } catch (err: any) {
        setError(err.message);
      }
    },
    []
  );

  return { weather, logs, loading, error, getWeatherData, getWeatherLogs };
};
```

#### Step 3.2: Integrate Rain List Screen

File: `src/app/rain-list.tsx`

Use the example from `EXAMPLES_RAIN_LIST_INTEGRATION.tsx`

#### Step 3.3: Integrate Rain Heatmap Screen

File: `src/app/rain-heatmap.tsx`

```typescript
// 1. Call apiClient.getWeatherHeatmap()
// 2. Use a map library (react-native-maps) to display heatmap data
// 3. Mark raining areas with intensity colors
```

#### Step 3.4: Integrate Route Screen

File: `src/app/route.tsx`

```typescript
// 1. Get user's current location (from permission-location)
// 2. Get destination coordinates
// 3. Call apiClient.checkRoute()
// 4. Display affected cameras
// 5. Suggest alternative routes if available
```

---

### Phase 4: Admin & Notifications (Week 4)

#### Step 4.1: Admin Dashboard

File: `src/app/admin/dashboard.tsx`

```typescript
// Load and display:
// - apiClient.getAdminStats()
// - apiClient.getRainFrequencyStats()
// - apiClient.getFailedCameras()
// - apiClient.getIngestionStats(7)
```

#### Step 4.2: Manage Users

File: `src/app/admin/manage-users.tsx`

```typescript
// Features:
// - apiClient.getUsers() - List with pagination
// - apiClient.banUser() - Ban/unban user
// - Search & filter users
```

#### Step 4.3: Manage Cameras

File: `src/app/admin/manage-cameras.tsx`

```typescript
// Features:
// - apiClient.getCameras() - List cameras
// - apiClient.createCamera() - Add new camera
// - apiClient.updateCamera() - Edit camera
// - apiClient.deleteCamera() - Remove camera
```

#### Step 4.4: Notification Subscriptions

File: `src/app/permission-notification.tsx`

```typescript
// Features:
// - apiClient.getSubscriptions() - List subscriptions
// - apiClient.createSubscription() - Create alert subscription
// - apiClient.updateSubscription() - Update settings
// - apiClient.deleteSubscription() - Remove subscription
```

---

## Authentication Flow

### 1. Initial Setup

```typescript
// App.tsx or root layout
import { AuthProvider } from '@/hooks/useAuth';

export default function App() {
  return (
    <AuthProvider>
      {/* App navigation */}
    </AuthProvider>
  );
}
```

### 2. Login Process

```typescript
const handleLogin = async (username: string, password: string) => {
  const response = await apiClient.login(username, password);
  
  // Store token
  await apiClient.setToken(response.data.token);
  
  // Store user info
  await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
  
  // Navigate to home
  navigation.replace('(tabs)');
};
```

### 3. Token Management

```typescript
// Token is automatically added to all requests via interceptor
// If token expires (401):
// - Token is cleared
// - User is redirected to login
// - Can implement refresh token if API supports it
```

### 4. Logout

```typescript
const handleLogout = async () => {
  await apiClient.clearToken();
  await AsyncStorage.removeItem('user');
  navigation.replace('login');
};
```

---

## Error Handling

### 1. Global Error Handler

```typescript
// services/api.ts - in response interceptor
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login
    } else if (error.response?.status === 403) {
      // Show permission error
    } else if (error.response?.status === 500) {
      // Show server error
    }
    return Promise.reject(error);
  }
);
```

### 2. Per-Component Error Handling

```typescript
try {
  const response = await apiClient.getCameras();
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'An error occurred';
  Alert.alert('Error', errorMessage);
}
```

### 3. Network Error Handling

```typescript
// axios will automatically handle network errors
// Add retry logic if needed:

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryApiCall(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

## Best Practices

### 1. Loading States

Always show loading indicator when fetching:

```typescript
{isLoading ? (
  <ActivityIndicator size="large" />
) : (
  <FlatList data={items} {...} />
)}
```

### 2. Empty States

Handle empty data gracefully:

```typescript
<FlatList
  data={items}
  ListEmptyComponent={
    <ThemedView style={styles.empty}>
      <ThemedText>No items found</ThemedText>
    </ThemedView>
  }
/>
```

### 3. Pagination

Load more items when scrolling:

```typescript
<FlatList
  onEndReached={() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }}
  onEndReachedThreshold={0.3}
/>
```

### 4. Data Caching

Implement caching to reduce API calls:

```typescript
const [cachedData, setCachedData] = useState<Record<string, any>>({});

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cachedData[key]) return cachedData[key];
  
  const data = await fetcher();
  setCachedData(prev => ({ ...prev, [key]: data }));
  return data;
};
```

### 5. Debouncing

Debounce search requests:

```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useCallback(
  debounce((query: string) => {
    loadCameras(1, query);
  }, 500),
  []
);

const handleSearch = (query: string) => {
  setSearchQuery(query);
  debouncedSearch(query);
};
```

### 6. Refresh Control

Always provide refresh functionality:

```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={['#007AFF']}
    />
  }
/>
```

### 7. Token Security

- Use `expo-secure-store` for token storage (not AsyncStorage)
- Don't log sensitive data
- Clear token on logout
- Handle token expiration

### 8. API Response Validation

```typescript
const validateResponse = (data: any): boolean => {
  if (!data) return false;
  if (Array.isArray(data) && data.length === 0) return true;
  return typeof data === 'object';
};
```

---

## Testing Integration

### 1. Test Login

```bash
# Start app
npm start

# Navigate to login screen
# Test with credentials from API documentation
```

### 2. Test API Calls

Use Postman or similar tool to verify endpoints:

```
Base URL: https://hcmvision-api.onrender.com/api
Authorization: Bearer {token_from_login}
```

### 3. Test Error Scenarios

- Invalid credentials
- Network offline
- Token expired
- Server errors

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Token may be expired
   - Credentials are incorrect
   - Solution: Clear AsyncStorage and re-login

2. **Network Error**
   - API server may be down
   - Device not connected to internet
   - Solution: Check Render.com status

3. **CORS Issues**
   - Should not occur with Expo (native app)
   - If using web, ensure backend has CORS headers

4. **Type Errors**
   - Make sure to import types from `@/types/api`
   - Run `npm run type-check` to verify

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up environment variables
3. ✅ Copy API client and types
4. ✅ Create auth hook
5. ✅ Integrate login/register screens
6. ✅ Integrate camera screens
7. ✅ Integrate weather screens
8. ✅ Implement admin features
9. ✅ Add comprehensive error handling
10. ✅ Test all endpoints
11. ✅ Deploy to production

---

## Support

For API documentation, visit:
https://hcmvision-api.onrender.com/swagger/index.html

For issues:
- Check error messages in console
- Review API response in Network tab
- Verify token is being sent in headers
- Check backend logs on Render.com

