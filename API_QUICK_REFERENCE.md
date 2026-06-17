# API Quick Reference Guide

Quick lookup for available API endpoints and how to use them.

---

## 🔐 Authentication APIs

### Register
```typescript
await apiClient.register(username, email, password);
// Returns: { token, user }
```

### Login
```typescript
const response = await apiClient.login(username, password);
const { token, user } = response.data;
await apiClient.setToken(token);
```

### Get Current User
```typescript
const response = await apiClient.getProfile();
// Returns: User { id, username, email, fullName, ... }
```

### Update Profile
```typescript
await apiClient.updateProfile({
  fullName: 'John Doe',
  phoneNumber: '+84987654321',
  avatarUrl: 'https://...'
});
```

### Change Password
```typescript
await apiClient.changePassword(oldPassword, newPassword);
```

### Forgot Password
```typescript
await apiClient.forgotPassword(email);
// Backend sends reset email
```

### Reset Password
```typescript
await apiClient.resetPassword(resetToken, newPassword);
```

### Logout
```typescript
await apiClient.clearToken();
```

---

## 📷 Camera APIs

### Get All Cameras
```typescript
const response = await apiClient.getCameras(
  search?: 'camera name',
  sortBy?: 'newest',
  page?: 1,
  pageSize?: 10
);
// Returns: CameraListResponse {
//   items: Camera[],
//   total: number,
//   page: number,
//   pageSize: number,
//   totalPages: number
// }
```

### Create Camera (Admin)
```typescript
const response = await apiClient.createCamera({
  id: 'CAM001',
  name: 'Front Entrance',
  latitude: 10.7769,
  longitude: 106.7009,
  wardId: 'WARD001',
  streamUrl: 'rtsp://...',
  streamType: 'RTSP'
});
```

### Update Camera (Admin)
```typescript
await apiClient.updateCamera('CAM001', {
  name: 'Updated Name',
  latitude: 10.7769,
  longitude: 106.7009,
  wardId: 'WARD001',
  status: 'Active',
  streamUrl: 'rtsp://...'
});
```

### Delete Camera (Admin)
```typescript
await apiClient.deleteCamera('CAM001');
```

### Upload Demo Image
```typescript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'demo.jpg'
} as any);

await apiClient.uploadDemoImage('CAM001', formData);
```

### Set Demo Image
```typescript
await apiClient.setDemoImage('CAM001', 'demo.jpg');
```

### Restore Stream
```typescript
await apiClient.restoreStream('CAM001', {
  streamUrl: 'rtsp://new-stream-url',
  streamType: 'RTSP'
});
```

### Run AI Test
```typescript
const response = await apiClient.runAiTest('CAM001', saveLog: true);
// Tests AI detection on camera stream
```

---

## 🌧️ Weather APIs

### Get Latest Weather
```typescript
const response = await apiClient.getLatestWeather();
// Returns: WeatherData {
//   temperature: number,
//   humidity: number,
//   rainProbability: number,
//   rainingCameras: number,
//   isRaining: boolean,
//   timestamp: string
// }
```

### Get Weather Logs
```typescript
const response = await apiClient.getWeatherLogs(
  minutes?: 180,      // Last 3 hours
  limit?: 100,        // Max records
  onlyWithImages?: false
);
// Returns: WeatherLogsResponse {
//   items: WeatherLog[],
//   total: number
// }
```

### Get Raining Cameras Count
```typescript
const response = await apiClient.getRainingCamerasCount(
  minutes?: 30  // In last 30 minutes
);
// Returns: number
```

### Get Raining Cameras List
```typescript
const response = await apiClient.getRainingCameras(
  minutes?: 30
);
// Returns: RainingCamera[] {
//   cameraId: string,
//   cameraName: string,
//   latitude: number,
//   longitude: number,
//   rainProbability: number,
//   timestamp: string
// }
```

### Report Weather
```typescript
await apiClient.reportWeather({
  cameraId: 'CAM001',
  isRaining: true,
  note: 'Heavy rain detected'
});
```

### Test AI on Image
```typescript
const formData = new FormData();
formData.append('ImageFile', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'test.jpg'
} as any);
formData.append('SaveLog', 'true');

const response = await apiClient.testWeatherAI(formData);
// Returns: { rainDetected: boolean, probability: number }
```

### Check Route for Rain
```typescript
const response = await apiClient.checkRoute({
  currentLatitude: 10.7769,
  currentLongitude: 106.7009,
  originLatitude: 10.7769,
  originLongitude: 106.7009,
  destinationLatitude: 10.8727,
  destinationLongitude: 106.7650,
  routePoints: [
    { lat: 10.78, lng: 106.71 },
    { lat: 10.79, lng: 106.72 }
  ]
});
// Returns: CheckRouteResponse {
//   hasRain: boolean,
//   affectedCameras: RainingCamera[],
//   safeAlternatives: RoutePoint[],
//   recommendation: string
// }
```

### Get Weather Heatmap
```typescript
const response = await apiClient.getWeatherHeatmap();
// Returns: HeatmapData {
//   points: Array<{
//     lat: number,
//     lng: number,
//     intensity: number
//   }>,
//   timestamp: string
// }
```

---

## ❤️ Favorite APIs

### Get Favorites
```typescript
const response = await apiClient.getFavorites();
// Returns: FavoriteListResponse {
//   items: Favorite[],
//   total: number
// }
```

### Add to Favorites
```typescript
await apiClient.addFavorite('CAM001');
```

### Remove from Favorites
```typescript
await apiClient.removeFavorite('CAM001');
```

---

## 📍 Location APIs

### Get All Wards
```typescript
const response = await apiClient.getWards();
// Returns: Ward[] {
//   id: string,
//   name: string,
//   districtId: string,
//   districtName: string,
//   latitude: number,
//   longitude: number
// }
```

### Get Ward by ID
```typescript
const response = await apiClient.getWardById('WARD001');
// Returns: Ward
```

### Get All Districts
```typescript
const response = await apiClient.getDistricts();
// Returns: District[] {
//   id: string,
//   name: string,
//   latitude: number,
//   longitude: number
// }
```

### Get Wards by District
```typescript
const response = await apiClient.getWardsByDistrict('District 1');
// Returns: Ward[]
```

---

## 🔔 Alert Subscription APIs

### Get All Subscriptions
```typescript
const response = await apiClient.getSubscriptions();
// Returns: AlertSubscription[] {
//   subscriptionId: string,
//   wardId: string,
//   wardName: string,
//   districtName: string,
//   thresholdProbability: number,
//   isEnabled: boolean,
//   createdAt: string
// }
```

### Create Subscription
```typescript
const response = await apiClient.createSubscription({
  wardId: 'WARD001',
  thresholdProbability: 0.7  // 70% rain probability
});
// Returns: AlertSubscription
```

### Update Subscription
```typescript
await apiClient.updateSubscription('SUB_UUID', {
  thresholdProbability: 0.8,
  isEnabled: true
});
```

### Delete Subscription
```typescript
await apiClient.deleteSubscription('SUB_UUID');
```

---

## 👥 Admin APIs

### Get Admin Statistics
```typescript
const response = await apiClient.getAdminStats();
// Returns: AdminStats {
//   totalCameras: number,
//   activeCameras: number,
//   offlineCameras: number,
//   totalUsers: number,
//   activeUsers: number,
//   averageRainProbability: number,
//   rainingCameras: number,
//   totalReports: number,
//   lastUpdateTime: string
// }
```

### Get Users
```typescript
const response = await apiClient.getUsers(
  search?: 'username',
  sortBy?: 'newest',
  page?: 1,
  pageSize?: 20
);
// Returns: AdminUsersResponse {
//   items: AdminUser[],
//   total: number,
//   page: number,
//   pageSize: number
// }
```

### Ban User
```typescript
await apiClient.banUser(userId);
```

### Get Rain Frequency Stats
```typescript
const response = await apiClient.getRainFrequencyStats();
```

### Get Failed Cameras
```typescript
const response = await apiClient.getFailedCameras();
// Returns: FailedCamera[] {
//   cameraId: string,
//   cameraName: string,
//   lastError: string,
//   lastErrorTime: string,
//   failureCount: number
// }
```

### Check Camera Health
```typescript
const response = await apiClient.checkCameraHealth();
// Returns: CameraHealth[] {
//   cameraId: string,
//   cameraName: string,
//   status: 'Healthy' | 'Warning' | 'Critical',
//   uptime: number,
//   lastSeen: string,
//   streamHealth: number
// }
```

### Get Ingestion Jobs
```typescript
const response = await apiClient.getIngestionJobs(
  page?: 1,
  pageSize?: 20,
  status?: 'Pending|Processing|Completed|Failed'
);
// Returns: IngestionJobsResponse {
//   items: IngestionJob[],
//   total: number,
//   page: number,
//   pageSize: number
// }
```

### Get Job Detail
```typescript
const response = await apiClient.getIngestionJobDetail('JOB_UUID');
// Returns: IngestionJob
```

### Get Ingestion Statistics
```typescript
const response = await apiClient.getIngestionStats(days?: 7);
// Returns: IngestionStats[] {
//   date: string,
//   processedRecords: number,
//   failedRecords: number,
//   averageProcessingTime: number
// }
```

### Get Audit Data
```typescript
const response = await apiClient.getAuditData();
// Returns: AuditLog[]
```

---

## 💬 Chatbot APIs

### Debug Chatbot
```typescript
const response = await apiClient.debugChatbot();
```

### Send Message
```typescript
const response = await apiClient.sendChatbotMessage('Hello, how are you?');
// Returns: ChatbotResponse {
//   message: string,
//   suggestions: string[]
// }
```

---

## Error Handling Pattern

```typescript
try {
  const response = await apiClient.getCameras();
  // Handle success
} catch (error: any) {
  const errorMessage = error.response?.data?.message || 'Unknown error';
  const statusCode = error.response?.status;
  
  if (statusCode === 401) {
    // Handle unauthorized - redirect to login
  } else if (statusCode === 403) {
    // Handle forbidden - show permission error
  } else if (statusCode === 404) {
    // Handle not found
  } else if (statusCode === 500) {
    // Handle server error
  } else {
    // Handle other errors
  }
}
```

---

## Common Use Cases

### 1. Initialize App (Check Auth)
```typescript
const getProfile = async () => {
  try {
    const response = await apiClient.getProfile();
    // User is authenticated
    setUser(response.data);
  } catch (error) {
    // Not authenticated - redirect to login
    navigation.replace('login');
  }
};
```

### 2. Sync Favorites List
```typescript
useFocusEffect(
  useCallback(() => {
    loadFavorites();
  }, [])
);

const loadFavorites = async () => {
  const response = await apiClient.getFavorites();
  const ids = new Set(response.data.items.map(f => f.cameraId));
  setFavorites(ids);
};
```

### 3. Real-time Weather Updates
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await apiClient.getLatestWeather();
    setWeatherData(response.data);
  }, 30000); // Every 30 seconds

  return () => clearInterval(interval);
}, []);
```

### 4. Infinite Scroll
```typescript
const handleLoadMore = () => {
  if (hasMore && !loading) {
    loadCameras(page + 1, searchQuery);
  }
};

<FlatList
  onEndReached={handleLoadMore}
  onEndReachedThreshold={0.3}
/>
```

---

## Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data |
| 400 | Bad Request | Check parameters |
| 401 | Unauthorized | Re-login |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show not found message |
| 500 | Server Error | Retry or contact support |
| 503 | Service Unavailable | Server maintenance |

---

## Token Management

```typescript
// Get current token
const token = await apiClient.getToken();

// Set new token
await apiClient.setToken(newToken);

// Clear token (logout)
await apiClient.clearToken();

// Token is automatically included in Authorization header
// Format: Bearer {token}
```

---

## Data Pagination

All list endpoints support:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: varies)
- `search`: Search query (optional)
- `sortBy`: Sort field (optional)

Example:
```typescript
// Get page 2 with 20 items
await apiClient.getCameras(undefined, undefined, 2, 20);
```

---

## Rate Limiting

- No explicit rate limits mentioned in API docs
- Recommended: Add exponential backoff for retries
- Implement debouncing for search endpoints

---

Last Updated: 2026-06-17
API Base: https://hcmvision-api.onrender.com/api
Documentation: https://hcmvision-api.onrender.com/swagger/index.html
