# 🏖️ Tính năng Quản lý Đơn xin nghỉ phép

## 📋 Tổng quan

Tính năng cho phép Doctor, Nurse, Staff nộp đơn xin nghỉ phép và Manager duyệt các đơn này.

## 👥 Phân quyền

### 1. **Doctor / Nurse / Staff**
- ✅ Tạo đơn xin nghỉ phép
- ✅ Xem lịch sử đơn xin nghỉ của bản thân
- ❌ Không thể xem đơn của người khác
- ❌ Không thể duyệt/từ chối đơn

### 2. **Manager**
- ✅ Xem tất cả đơn xin nghỉ
- ✅ Duyệt/Từ chối đơn xin nghỉ
- ✅ Lọc theo trạng thái, tìm kiếm theo lý do

## 🔗 API Endpoints

### Backend API đã có sẵn:

#### 1. Tạo đơn xin nghỉ
- **POST** `/api/leave-requests`
- **Quyền:** Doctor, Nurse, Staff
- **Body:**
```json
{
  "startDate": "2025-01-15",
  "endDate": "2025-01-20",
  "reason": "Nghỉ phép cá nhân"
}
```

#### 2. Lấy danh sách đơn xin nghỉ
- **GET** `/api/leave-requests?page=1&limit=10&status=Pending&search=nghỉ`
- **Quyền:** Manager
- **Query params:**
  - `page`: số trang (mặc định 1)
  - `limit`: số bản ghi/trang (mặc định 10, tối đa 100)
  - `status`: Pending | Approved | Rejected
  - `search`: tìm kiếm theo lý do

#### 3. Duyệt/Từ chối đơn
- **PATCH** `/api/leave-requests/:id`
- **Quyền:** Manager
- **Body:**
```json
{
  "status": "Approved"
}
```
hoặc
```json
{
  "status": "Rejected"
}
```

## 📊 Database Schema

```javascript
LeaveRequest {
  _id: ObjectId,
  userId: ObjectId (ref: User),
  startDate: Date,
  endDate: Date,
  reason: String,
  status: 'Pending' | 'Approved' | 'Rejected',
  approvedByManager: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Frontend Implementation

### 1. **Staff/Doctor/Nurse UI** (`/pages/Staff/LeaveRequest.tsx`)
**Đường dẫn:**
- Staff: `/staff/leave-requests`
- Doctor: `/doctor/leave-requests`
- Nurse: `/nurse/leave-requests`

**Chức năng:**
- Form gửi đơn xin nghỉ với date picker và textarea
- Validation: ngày bắt đầu >= hôm nay, ngày kết thúc > ngày bắt đầu
- Hiển thị số ngày nghỉ tự động
- Bảng lịch sử đơn xin nghỉ với status badge
- Toast notifications

### 2. **Manager UI** (`/pages/Manager/LeaveRequestManagement.tsx`)
**Đường dẫn:** `/manager/leave-requests`

**Chức năng:**
- Bảng hiển thị tất cả đơn xin nghỉ
- Filters: status, search by reason
- Action buttons: Approve (✓), Reject (✗)
- Confirmation modal trước khi approve/reject
- Hiển thị thông tin nhân viên (tên, vai trò)
- Toast notifications

### 3. **API Client** (`/api/leaveRequest.ts`)
```typescript
leaveRequestApi.createLeaveRequest(data)
leaveRequestApi.getAllLeaveRequests(params)
leaveRequestApi.handleLeaveRequest(requestId, status)
```

## ⚠️ Lưu ý Backend

### ❌ Vấn đề hiện tại trong backend:

#### 1. **Lỗi typo trong `getAllLeaveRequest` controller** (dòng 103)
```javascript
const searchKey = String(search).strim(); // ❌ sai
```
**Cần sửa thành:**
```javascript
const searchKey = String(search).trim(); // ✅ đúng
```

#### 2. **Lỗi typo trong `getAllLeaveRequest` controller** (dòng 107)
```javascript
{reason : {$regax : regax}} // ❌ sai
```
**Cần sửa thành:**
```javascript
{reason : {$regex : regex}} // ✅ đúng
```

#### 3. **Lỗi biến chưa định nghĩa trong `createLeaveRequest` controller** (dòng 56)
```javascript
if (cleanName.length < 3) { // ❌ cleanName không tồn tại
```
**Cần sửa thành:**
```javascript
if (cleanReason.length < 3) { // ✅ đúng
```

#### 4. **Backend không populate thông tin User**

Hiện tại backend chỉ trả về `userId` là ObjectId, không có thông tin chi tiết.

**Cần thêm populate trong `getAllLeaveRequest` controller:**

```javascript
const [total, leaveRequests] = await Promise.all([
  LeaveRequest.countDocuments(filter),
  LeaveRequest.find(filter)
    .populate({
      path: 'userId',
      select: 'fullName email role phone'
    })
    .populate({
      path: 'approvedByManager',
      select: 'fullName'
    })
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .lean()
]);
```

#### 5. **Staff/Doctor/Nurse không thể xem đơn của chính mình**

Route `GET /leave-requests` chỉ cho phép Manager, nhưng Staff/Doctor/Nurse cần xem lịch sử đơn của bản thân.

**Giải pháp:**

##### Option A: Tạo endpoint mới cho staff
```javascript
// routes/leaveRequest.route.js
router.get('/my-requests', verifyToken, verifyRole('Doctor','Nurse','Staff'), getMyLeaveRequests);

// controllers/leaveRequest.controller.js
const getMyLeaveRequests = async(req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({ userId: req.user.userId })
      .populate({
        path: 'approvedByManager',
        select: 'fullName'
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: true,
      total: leaveRequests.length,
      data: leaveRequests
    });
  } catch (error) {
    console.log('Lỗi khi xem đơn xin nghỉ của tôi', error);
    return res.status(500).json({
      status: false,
      message: 'Đã xảy ra lỗi'
    });
  }
}
```

##### Option B: Mở rộng route hiện tại (Khuyến nghị)
```javascript
// routes/leaveRequest.route.js
router.get('/', verifyToken, verifyRole('Doctor','Nurse','Staff','Manager'), getAllLeaveRequest);

// controllers/leaveRequest.controller.js - thêm filter theo role
const getAllLeaveRequest = async(req, res) => {
  try {
    // ... existing code ...

    const filter = {};
    
    // Nếu là staff/doctor/nurse, chỉ xem đơn của mình
    if(['Doctor', 'Nurse', 'Staff'].includes(req.user.role)) {
      filter.userId = req.user.userId;
    }
    
    // Nếu là Manager, xem tất cả
    // (không cần thêm filter)

    if(status && STATUS.includes(status)) filter.status = status;

    // ... rest of the code ...
  }
}
```

## 📝 Test Cases

### 1. Doctor/Nurse/Staff
- [ ] Tạo đơn xin nghỉ thành công
- [ ] Validation: không cho chọn ngày quá khứ
- [ ] Validation: ngày kết thúc phải sau ngày bắt đầu
- [ ] Hiển thị số ngày nghỉ chính xác
- [ ] Xem lịch sử đơn của bản thân
- [ ] Không xem được đơn của người khác

### 2. Manager
- [ ] Xem tất cả đơn xin nghỉ
- [ ] Filter theo status (Pending/Approved/Rejected)
- [ ] Search theo lý do nghỉ
- [ ] Duyệt đơn thành công
- [ ] Từ chối đơn thành công
- [ ] Hiển thị thông tin người gửi đơn đầy đủ

## 🚀 Priority
**HIGH** - Cần sửa các lỗi backend trước khi deploy

## 📁 Files liên quan

### Frontend:
- `HaiAnhTeeth_FE/src/api/leaveRequest.ts`
- `HaiAnhTeeth_FE/src/pages/Staff/LeaveRequest.tsx`
- `HaiAnhTeeth_FE/src/pages/Manager/LeaveRequestManagement.tsx`
- `HaiAnhTeeth_FE/src/App.tsx`
- `HaiAnhTeeth_FE/src/layouts/DoctorLayout.tsx`
- `HaiAnhTeeth_FE/src/layouts/NurseLayout.tsx`
- `HaiAnhTeeth_FE/src/layouts/StaffLayout.tsx`
- `HaiAnhTeeth_FE/src/layouts/ManagerLayout.tsx`

### Backend:
- `HaiAnhTeeth_BE/routes/leaveRequest.route.js`
- `HaiAnhTeeth_BE/controllers/leaveRequest.controller.js`
- `HaiAnhTeeth_BE/models/leaveRequest.model.js`

