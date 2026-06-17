# API Integration Plan - HCMVision Frontend

**API Base URL:** `https://hcmvision-api.onrender.com/api`

---

## 📊 API Summary (32 endpoints across 8 controllers)

### ✅ AVAILABLE APIs

#### 1. **Auth Controller** (5 endpoints)
- `POST /Auth/register` - Đăng ký tài khoản
- `POST /Auth/login` - Đăng nhập
- `POST /Auth/forgot-password` - Quên mật khẩu
- `POST /Auth/reset-password` - Đặt lại mật khẩu
- `GET /Auth/me` - Lấy thông tin người dùng hiện tại
- `PUT /Auth/me` - Cập nhật hồ sơ
- `POST /Auth/change-password` - Đổi mật khẩu

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào login.tsx, register.tsx, forgot-password.tsx

---

#### 2. **Camera Controller** (6 endpoints)
- `GET /Camera?search=&sortBy=&page=1&pageSize=10` - Danh sách camera (phân trang)
- `POST /Camera` - Tạo camera mới (admin)
- `PUT /Camera/{id}` - Cập nhật camera
- `DELETE /Camera/{id}` - Xóa camera
- `POST /Camera/{id}/demo-image` - Upload ảnh demo
- `PUT /Camera/{id}/demo-image` - Đặt ảnh demo
- `PUT /Camera/{id}/restore-stream` - Khôi phục stream
- `POST /Camera/{id}/run-ai-test` - Chạy test AI

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào cameras.tsx, camera-detail.tsx, admin/manage-cameras.tsx

---

#### 3. **Weather Controller** (8 endpoints)
- `GET /Weather/latest` - Dữ liệu thời tiết mới nhất
- `GET /Weather/logs?minutes=180&limit=100&onlyWithImages=false` - Lịch sử thời tiết
- `GET /Weather/raining-cameras/count?minutes=30` - Số camera đang mưa
- `GET /Weather/raining-cameras?minutes=30` - Danh sách camera đang mưa
- `POST /Weather/test-ai` - Test AI nhân diện mưa (upload ảnh)
- `POST /Weather/report` - Báo cáo thời tiết
- `POST /Weather/check-route` - Kiểm tra tuyến đường có mưa
- `GET /Weather/heatmap` - Bản đồ nhiệt độ mưa

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào rain-list.tsx, rain-heatmap.tsx, route.tsx

---

#### 4. **Location Controller** (4 endpoints)
- `GET /Location/wards` - Danh sách tất cả các phường
- `GET /Location/wards/{id}` - Chi tiết phường
- `GET /Location/districts` - Danh sách quận
- `GET /Location/wards/by-district/{districtName}` - Danh sách phường theo quận

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp cho tính năng lọc, subscription

---

#### 5. **Favorite Controller** (3 endpoints)
- `GET /Favorite` - Danh sách camera yêu thích
- `POST /Favorite/{cameraId}` - Thêm camera yêu thích
- `DELETE /Favorite/{cameraId}` - Xóa camera yêu thích

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào cameras.tsx, camera-detail.tsx

---

#### 6. **AlertSubscription Controller** (3 endpoints)
- `GET /subscriptions` - Danh sách subscription
- `POST /subscriptions` - Tạo subscription cảnh báo
- `PUT /subscriptions/{id}` - Cập nhật subscription
- `DELETE /subscriptions/{id}` - Xóa subscription

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào permission-notification.tsx, more.tsx

---

#### 7. **Chatbot Controller** (2 endpoints)
- `GET /Chatbot/debug` - Debug chatbot
- `POST /Chatbot/message` - Gửi tin nhắn cho chatbot

**Status:** ⚠️ **CÓ LIÊN QUAN** - Có thể tích hợp nếu cần hỗ trợ chatbot

---

#### 8. **Admin Controller** (8 endpoints)
- `GET /Admin/stats` - Thống kê tổng quát
- `GET /Admin/audit-data` - Dữ liệu kiểm toán
- `GET /Admin/users?search=&sortBy=newest&page=1&pageSize=20` - Danh sách người dùng
- `PUT /Admin/users/{id}/ban` - Khóa người dùng
- `GET /Admin/stats/rain-frequency` - Tần suất mưa
- `GET /Admin/stats/failed-cameras` - Camera lỗi
- `GET /Admin/stats/check-camera-health` - Kiểm tra sức khỏe camera
- `GET /Admin/ingestion-jobs?page=1&pageSize=20&status=` - Danh sách job xử lý dữ liệu
- `GET /Admin/ingestion-jobs/{jobId}` - Chi tiết job
- `GET /Admin/ingestion-stats?days=7` - Thống kê xử lý dữ liệu

**Status:** ✅ **CÓ LIÊN QUAN** - Cần tích hợp vào admin/* screens

---

## 🔄 Integration Roadmap

### Phase 1: Core Authentication (Priority: **HIGH**)
- [ ] Setup API client with axios/fetch
- [ ] Integrate Auth endpoints vào login.tsx
- [ ] Integrate Auth endpoints vào register.tsx
- [ ] Integrate Auth endpoints vào forgot-password.tsx
- [ ] Token management & storage (AsyncStorage)

### Phase 2: Camera Management (Priority: **HIGH**)
- [ ] Integrate GET /Camera vào cameras.tsx
- [ ] Integrate camera details vào camera-detail.tsx
- [ ] Integrate Favorite endpoints
- [ ] Admin: Integrate POST/PUT/DELETE /Camera vào manage-cameras.tsx

### Phase 3: Weather & Traffic (Priority: **HIGH**)
- [ ] Integrate GET /Weather/latest & logs vào rain-list.tsx
- [ ] Integrate GET /Weather/heatmap vào rain-heatmap.tsx
- [ ] Integrate POST /Weather/check-route vào route.tsx
- [ ] Integrate GET /Weather/raining-cameras

### Phase 4: Notifications & Subscriptions (Priority: **MEDIUM**)
- [ ] Integrate AlertSubscription endpoints
- [ ] Setup notification permissions vào permission-notification.tsx
- [ ] Location data vào permission-location.tsx

### Phase 5: Admin Dashboard (Priority: **MEDIUM**)
- [ ] Integrate Admin/stats endpoints vào admin/dashboard.tsx
- [ ] Integrate Admin/users endpoints vào admin/manage-users.tsx
- [ ] Integrate camera management vào admin/manage-cameras.tsx
- [ ] Integrate system health vào admin/system-health.tsx

### Phase 6: Additional Features (Priority: **LOW**)
- [ ] Chatbot integration (optional)
- [ ] Weather report functionality
- [ ] AI test functionality

---

## 🚫 APIs Not Applicable

**Tidak có API nào không thể tích hợp**. Tất cả 32 endpoints đều có liên quan đến các chức năng hiện có trong ứng dụng.

---

## 📝 Implementation Notes

### Authentication
```typescript
// JWT Token storage
localStorage.setItem('token', response.token);
// Add token to headers
headers: { Authorization: `Bearer ${token}` }
```

### API Client Setup Required
Create `src/services/api.ts`:
- Base URL configuration
- Interceptors for token management
- Error handling

### Data Models to Create
- User, Camera, Weather, Subscription, Location models
- Response/Request DTOs mapping

### Screens to Modify
1. `login.tsx` - Auth integration
2. `register.tsx` - Registration
3. `cameras.tsx` - Camera list + favorites
4. `camera-detail.tsx` - Camera details
5. `rain-list.tsx` - Weather data
6. `rain-heatmap.tsx` - Heatmap visualization
7. `route.tsx` - Route weather check
8. `admin/dashboard.tsx` - Stats dashboard
9. `admin/manage-cameras.tsx` - Camera CRUD
10. `admin/manage-users.tsx` - User management
11. `admin/system-health.tsx` - System monitoring
12. `permission-notification.tsx` - Subscriptions
13. `permission-location.tsx` - Location data

---

## 🔐 Security Notes

- All endpoints require **JWT Bearer token** (except login/register/forgot-password)
- Token should be stored securely using Expo SecureStore
- Implement token refresh mechanism
- Handle 401/403 responses for re-authentication

---

## ✨ Next Steps

1. Create API client service
2. Create TypeScript models/interfaces
3. Implement Phase 1 (Auth) first
4. Test each integration with backend
5. Add error handling & loading states
6. Setup notification permissions

