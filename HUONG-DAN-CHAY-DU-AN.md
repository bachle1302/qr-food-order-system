# Hướng Dẫn Chạy Dự Án Restaurant Management System (RMS)



## Yêu Cầu Hệ Thống

### Phần mềm cần cài đặt:

| Phần mềm | Phiên bản | Link tải |
|----------|-----------|----------|
| Node.js | >= 18.x | https://nodejs.org/ |
| Java JDK | 17 | https://www.oracle.com/java/technologies/downloads/#java17 |
| Maven | >= 3.9 | https://maven.apache.org/download.cgi |
| MongoDB | Atlas hoặc Local | https://www.mongodb.com/atlas |

### Kiểm tra cài đặt:

```bash
# Kiểm tra Node.js
node -v

# Kiểm tra npm
npm -v

# Kiểm tra Java
java -version

# Kiểm tra Maven
mvn -version
```

---

## Cấu Trúc Dự Án

```
backend/                    # Spring Boot Backend
├── src/
│   └── main/
│       ├── java/com/rms/
│       │   ├── config/     # Security, CORS config
│       │   ├── controller/ # REST API endpoints
│       │   ├── dto/        # Data Transfer Objects
│       │   ├── model/      # MongoDB entities
│       │   ├── repository/ # MongoDB repositories
│       │   ├── security/   # JWT authentication
│       │   └── service/    # Business logic
│       └── resources/
│           └── application.yml
└── pom.xml
---

## Hướng Dẫn Cài Đặt

### Bước 1: Clone dự án

```bash
git clone <repository-url>
cd backend
```

### Bước 2: Cấu hình Backend

#### 2.1. Cấu hình MongoDB

Mở file `backend/src/main/resources/application.yml` và cập nhật connection string:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
      database: rms
```

**Lưu ý**: Thay thế `<username>`, `<password>`, `<cluster>`, `<database>` bằng thông tin MongoDB của bạn.

#### 2.2. Cấu hình JWT Secret

Trong file `application.yml`, đảm bảo có JWT secret (base64 encoded, ít nhất 32 ký tự):

```yaml
jwt:
  secret: <your-base64-encoded-secret>
  expiration: 86400000        # 24 giờ
  refresh-expiration: 604800000  # 7 ngày
```

**Tạo secret key**:
```bash
# Linux/Mac
echo -n "your-secret-key-at-least-32-characters" | base64

# Windows PowerShell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your-secret-key-at-least-32-characters"))
```

### Bước 3: Cài đặt Dependencies


#### Backend:
```bash
# Từ thư mục backend
cd backend
mvn clean install -DskipTests
```

---

## Tạo Tài Khoản ADMIN Đầu Tiên

**⚠️ QUAN TRỌNG:** Trước khi sử dụng hệ thống, bạn cần tạo tài khoản ADMIN đầu tiên trực tiếp trong MongoDB.

### Cách 1: Sử dụng MongoDB Compass hoặc Atlas

1. Mở MongoDB Compass hoặc truy cập MongoDB Atlas
2. Kết nối đến database `rms`
3. Tạo collection `users` (nếu chưa có)
4. Insert document mới:

```json
{
  "email": "admin@rms.com",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  "displayName": "Admin",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": {"$date": "2025-12-18T00:00:00.000Z"}
}
```

**Password mặc định:** `admin123` (đã được mã hóa BCrypt)

### Cách 2: Sử dụng MongoDB Shell

```bash
mongosh "mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rms"

db.users.insertOne({
  email: "admin@rms.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  displayName: "Admin",
  role: "ADMIN",
  isActive: true,
  createdAt: new Date()
})
```

### Đăng Nhập Với Tài Khoản ADMIN

Sau khi tạo tài khoản ADMIN, đăng nhập với:
- **Email:** `admin@rms.com`
- **Password:** `admin123`

**🔒 Khuyến nghị:** Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

---

## Chạy Dự Án

#### Terminal - Backend:
```bash
cd backend
mvn spring-boot:run
```
Backend sẽ chạy tại: `http://localhost:8017`

---

## API Endpoints

### Authentication

**LƯU Ý QUAN TRỌNG VỀ PHÂN QUYỀN:**
- **Chỉ có 2 role:** `ADMIN` và `STAFF`
- **ADMIN**: Có quyền cao nhất, quản lý toàn bộ hệ thống
- **STAFF**: Nhân viên, có quyền quản lý đơn hàng, món ăn, bàn, thanh toán
- **Tạo tài khoản**: Chỉ ADMIN mới được tạo tài khoản mới (để tạo tài khoản STAFF)
- **Đặt order**: Ai cũng có thể đặt order qua endpoint public

*Những API cần token phải có Bearer Token `accessToken` trong header Authorization*

---

=====
AUTHENTICATION
=====

### 1. Đăng ký tài khoản mới (CHỈ ADMIN)

| POST | `/api/auth/register` | Tạo tài khoản mới cho STAFF (CHỈ ADMIN) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN. Chỉ ADMIN mới có thể tạo tài khoản mới.

ví dụ payload 
```json
{
    "displayName": "Nguyen Van B",
    "email": "nguyenvanb@gmail.com",
    "password": "Son1182004",
    "role": "STAFF"
}
```

**Role có thể sử dụng:**
- `STAFF` - Nhân viên (được phép tạo)
- `ADMIN` - Quản trị viên (KHÔNG được phép tạo qua API này)

response
```json
{
    "success": true,
    "message": "Registration successful",
    "data": {
        "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
        "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
        "tokenType": "Bearer",
        "user": {
            "id": "6933020e1415aa6de9a78b70",
            "email": "nguyenvanb@gmail.com",
            "displayName": "Nguyen Van B",
            "role": "STAFF",
            "avatar": null,
            "createdAt": "2025-12-18T10:02:22.803"
        }
    }
}
```

### 2. Đăng nhập

| POST | `/api/auth/login` | Đăng nhập (PUBLIC) |

**⚠️ LƯU Ý:** Endpoint này là public, không cần token.

ví dụ payload
```json
{
    "email": "nguyenvanb@gmail.com",
    "password": "Abc123456"
}
```

response
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
        "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
        "tokenType": "Bearer",
        "user": {
            "id": "6933020e1415aa6de9a78b70",
            "email": "nguyenvanb@gmail.com",
            "displayName": "Nguyen Van B",
            "role": "STAFF",
            "avatar": null,
            "createdAt": "2025-12-05T23:02:22.803"
        }
    }
}
```

### 3. Refresh Token

| POST | `/api/auth/refresh` | Refresh token (PUBLIC) |

ví dụ payload
```json
{
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

response
```json
{
    "success": true,
    "message": "Token refreshed",
    "data": {
        "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
        "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
        "tokenType": "Bearer",
        "user": {
            "id": "6933020e1415aa6de9a78b70",
            "email": "nguyenvanb@gmail.com",
            "displayName": "Nguyen Van B",
            "role": "STAFF",
            "avatar": null,
            "createdAt": "2025-12-05T23:02:22.803"
        }
    }
}
```


------------------------------------------------------------------------------------------------------



=====
USER (Quản lý nhân viên)
=====

### 1. Lấy thông tin user theo ID

| GET | `/api/users/{id}` | Lấy thông tin user theo ID (CHỈ ADMIN) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN.

**Ví dụ:**
```
GET /api/users/6933020e1415aa6de9a78b70
```

response
```json
{
    "success": true,
    "message": "User retrieved successfully",
    "data": {
        "id": "6933020e1415aa6de9a78b70",
        "email": "nguyenvanb@gmail.com",
        "displayName": "Nguyen Van B",
        "role": "STAFF",
        "avatar": null,
        "createdAt": "2025-12-05T23:02:22.803"
    }
}
```

### 2. Lấy danh sách tất cả users

| GET | `/api/users` | Lấy danh sách tất cả users (CHỈ ADMIN) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN.

**Lấy tất cả users:**
```
GET /api/users
```

**Lọc theo role:**
```
GET /api/users?role=STAFF
GET /api/users?role=ADMIN
```

response
```json
{
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
        {
            "id": "6933020e1415aa6de9a78b70",
            "email": "nguyenvanb@gmail.com",
            "displayName": "Nguyen Van B",
            "role": "STAFF",
            "avatar": null,
            "createdAt": "2025-12-05T23:02:22.803"
        },
        {
            "id": "693301a51415aa6de9a78b6f",
            "email": "admin@rms.com",
            "displayName": "Admin",
            "role": "ADMIN",
            "avatar": null,
            "createdAt": "2025-12-05T22:58:45.123"
        }
    ]
}
```

### 3. Cập nhật trạng thái hoạt động của user

| PUT | `/api/users/{id}/status` | Kích hoạt/vô hiệu hóa tài khoản user (CHỈ ADMIN) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN.

ví dụ payload
```json
{
    "isActive": false
}
```

response
```json
{
    "success": true,
    "message": "User status updated successfully",
    "data": {
        "id": "6933020e1415aa6de9a78b70",
        "email": "nguyenvanb@gmail.com",
        "displayName": "Nguyen Van B",
        "role": "STAFF",
        "avatar": null,
        "createdAt": "2025-12-05T23:02:22.803"
    }
}
```

**Giải thích:**
- `isActive: true` - Kích hoạt tài khoản (user có thể đăng nhập)
- `isActive: false` - Vô hiệu hóa tài khoản (user không thể đăng nhập)

### 4. Cập nhật thông tin user

| PUT | `/api/users/{id}` | Cập nhật thông tin user (CHỈ ADMIN) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN.

ví dụ payload
```json
{
    "email": "nguyenvanb.updated@gmail.com",
    "displayName": "Nguyen Van B Updated",
    "password": "NewPassword123",
    "avatar": "https://example.com/avatar.jpg"
}
```

**Lưu ý:**
- Tất cả các trường đều optional (chỉ gửi trường nào muốn cập nhật)
- Password sẽ được mã hóa tự động
- Không thể thay đổi role qua endpoint này

response
```json
{
    "success": true,
    "message": "User updated successfully",
    "data": {
        "id": "6933020e1415aa6de9a78b70",
        "email": "nguyenvanb.updated@gmail.com",
        "displayName": "Nguyen Van B Updated",
        "role": "STAFF",
        "avatar": "https://example.com/avatar.jpg",
        "createdAt": "2025-12-05T23:02:22.803"
    }
}
```

------------------------------------------------------------------------------------------------------



=====
TABLE
=====
| POST | `/api/tables` | Tạo bàn mới (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
    "name": "B4",
    "seats": 3
}

response
{
    "id": "69330a7a17364e06252ede39",
    "name": "B4",
    "seats": 3,
    "available": true
}

| GET | `/api/tables/6932f42aaa07ce07d7f5edf6` | Lấy thông tin chi tiết bàn (PUBLIC) |
response
{
    "id": "6932f42aaa07ce07d7f5edf6",
    "name": "A1",
    "seats": 5,
    "available": true
}

| PUT | `/api/tables/6932f42aaa07ce07d7f5edf6` | Chỉnh sửa thông tin bàn (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
  "name": "Bàn VIP 1",
  "seats": 6
}
response
{
    "id": "6932f42aaa07ce07d7f5edf6",
    "name": "Bàn VIP 1",
    "seats": 6,
    "available": true
}

| DELETE | `/api/tables/6932f42aaa07ce07d7f5edf6` | Xóa bàn (Chỉ ADMIN OR STAFF) |

------------------------------------------------------------------------------------------------------



=====
DISH
=====
| POST | `/api/dishes` | Tạo món (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
  "name": "Phở gà",
  "price": 35000,
  "categoryId": "6932f6c8aa07ce07d7f5edfa",
  "imageUrl": "https://abc.com/phoga.jpg"
}
response
{
    "id": "6932fd61647cbf1cf45c37d9",
    "name": "Phở gà",
    "description": null,
    "price": 35000.0,
    "categoryId": "abc123",
    "available": true,
    "imageUrl": "https://abc.com/phoga.jpg"
}

| GET | `/api/dishes/6932fb811024662f11ad577b` | Thông tin món  |
response
{
    "id": "6932fb811024662f11ad577b",
    "name": "Cơm gà",
    "description": "Cơm gà xối mỡ1",
    "price": 45000.0,
    "categoryId": "67a2049192ccab44ed001111",
    "available": true,
    "imageUrl": /anhcomga.img
}
| GET | `/api/dishes/` | Danh sách món  |
response
[
    {
        "id": "6932fb4e1024662f11ad577a",
        "name": "Cơm gà",
        "description": "Cơm gà xối mỡ",
        "price": 45000.0,
        "categoryId": "67a2049192ccab44ed001111",
        "available": true,
        "imageUrl": null
    },
    {
        "id": "6932fbed1024662f11ad577c",
        "name": "Cơm gà2",
        "description": "Cơm gà xối mỡ2",
        "price": 45000.0,
        "categoryId": "67a2049192ccab44ed001111",
        "available": true,
        "imageUrl": null
    }
]


| PUT | `/api/dishes/6932fb811024662f11ad577b` | Sửa thông tin món (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
    "name": "Cơm rang dưa bò"
    "description": "Cơm chiên cùng với dưa và thịt bò thơm ngon" 
}
response
{
    "id": "6932fb811024662f11ad577b",
    "name": "Cơm rang dưa bò",
    "description": "Cơm chiên cùng với dưa và thịt bò thơm ngon" 
    "price": 45000.0,
    "categoryId": "67a2049192ccab44ed001111",
    "available": true,
    "imageUrl": /anhcomga.img
}

| DELETE | `/api/dishes/6932fb811024662f11ad577b` | Xóa món (Chỉ ADMIN OR STAFF) |


------------------------------------------------------------------------------------------------------



=====
CATEGORY
=====
| POST | `/api/categories` | Tạo danh mục món (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
  "name": "Mì"
}

response
{
    "id": "6932f6c8aa07ce07d7f5edfa",
    "name": "Mì",
    "description": null
}

| GET | `/api/categories/6932f6c8aa07ce07d7f5edfa` | Thông tin danh mục (PUBLIC) |
response
{
    "id": "6932f6c8aa07ce07d7f5edfa",
    "name": "Mì",
    "description": null
}

| PUT | `/api/categories/6932f6c8aa07ce07d7f5edfa` | Sửa thông tin danh mục (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
    "name": "Cơm"
    "description": "Cơm" 
}
response
{
    "id": "6932f6c8aa07ce07d7f5edfa",
    "name": "Cơm",
    "description": "Cơm ngon"
}
| DELETE | `/api/categories/6932f6c8aa07ce07d7f5edfa` | Xóa danh mục (Chỉ ADMIN OR STAFF) |

------------------------------------------------------------------------------------------------------






=====
Order
=====

| POST | `/api/orders` | Tạo order món (PUBLIC) |

**⚠️ LƯU Ý:** Endpoint này là public, không cần token. Ai cũng có thể tạo order.

ví dụ payload
{
  "tableId": "6932f42aaa07ce07d7f5edf6",
  "items": [
    {
      "dishId": "6932fb4e1024662f11ad577a",
      "quantity": 2
    },
    {
      "dishId": "6932fd61647cbf1cf45c37d9",
      "quantity": 1
    }
  ]
}
response
{
    "id": "6932f6c8aa07ce07d7f5edfa",
    "name": "Mì",
    "description": null
}

| GET | `/api/orders/69330f8f17364e06252ede3a` | Thông tin order (Chỉ ADMIN OR STAFF) |
response
{
    "id": "69330f8f17364e06252ede3a",
    "tableId": "6932f42aaa07ce07d7f5edf6",
    "items": [
        {
            "dishId": "6932fb4e1024662f11ad577a",
            "quantity": 2,
            "pricePerUnit": 45000.0
        },
        {
            "dishId": "6932fd61647cbf1cf45c37d9",
            "quantity": 1,
            "pricePerUnit": 35000.0
        }
    ],
    "totalPrice": 125000.0,
    "createdAt": "2025-12-05T23:59:59.617",
    "status": "NEW"
}

| PUT | `/api/orders/69330f8f17364e06252ede3a` | Cập nhật order (Chỉ ADMIN OR STAFF) |

**⚠️ LƯU Ý:** Endpoint này yêu cầu token của ADMIN hoặc STAFF.

**Lưu ý:**
- Tất cả các trường đều optional (chỉ gửi trường nào muốn cập nhật)
- Khi cập nhật items, tổng giá sẽ được tính lại tự động

ví dụ payload
```json
{
  "tableId": "6932f42aaa07ce07d7f5edf7",
  "items": [
    {
      "dishId": "6932fb4e1024662f11ad577a",
      "quantity": 3
    }
  ],
  "note": "Ghi chú mới"
}
```

response
```json
{
    "id": "69330f8f17364e06252ede3a",
    "tableId": "6932f42aaa07ce07d7f5edf7",
    "items": [
        {
            "dishId": "6932fb4e1024662f11ad577a",
            "quantity": 3,
            "pricePerUnit": 45000.0
        }
    ],
    "totalPrice": 135000.0,
    "createdAt": "2025-12-05T23:59:59.617",
    "status": "NEW",
    "note": "Ghi chú mới"
}
```

| PUT | `/api/orders/69330f8f17364e06252ede3a/status` | Cập nhật trạng thái order (Chỉ ADMIN OR STAFF) |
ví dụ payload
{
  "status": "COMPLETED"
}

response
{
    "id": "69330f8f17364e06252ede3a",
    "tableId": "6932f42aaa07ce07d7f5edf6",
    "items": [
        {
            "dishId": "6932fb4e1024662f11ad577a",
            "quantity": 2,
            "pricePerUnit": 45000.0
        },
        {
            "dishId": "6932fd61647cbf1cf45c37d9",
            "quantity": 1,
            "pricePerUnit": 35000.0
        }
    ],
    "totalPrice": 125000.0,
    "createdAt": "2025-12-05T23:59:59.617",
    "status": "COMPLETED"
}
| DELETE | `/api/orders/69330f8f17364e06252ede3a` | Xóa order (Chỉ ADMIN OR STAFF) |

| GET | `/api/orders/summary/daily` | Tổng hợp đơn hàng theo ngày (Chỉ ADMIN OR STAFF) |

**Lấy tổng hợp đơn hàng của ngày hôm nay:**
```
GET /api/orders/summary/daily
```

**Lấy tổng hợp đơn hàng của ngày cụ thể:**
```
GET /api/orders/summary/daily?date=2025-12-18
```

response
```json
{
    "date": "2025-12-18",
    "totalOrders": 25,
    "completedOrders": 20,
    "cancelledOrders": 2,
    "pendingOrders": 3,
    "totalRevenue": 2500000.0,
    "averageOrderValue": 125000.0,
    "orderIds": [
        "69330f8f17364e06252ede3a",
        "69330fa017364e06252ede3b",
        "69330fb117364e06252ede3c"
    ]
}
```

**Giải thích các trường:**
- `date`: Ngày được tổng hợp (format: YYYY-MM-DD)
- `totalOrders`: Tổng số đơn hàng trong ngày
- `completedOrders`: Số đơn hàng đã hoàn thành
- `cancelledOrders`: Số đơn hàng đã hủy
- `pendingOrders`: Số đơn hàng đang xử lý (NEW, PREPARING, READY, SERVED)
- `totalRevenue`: Tổng doanh thu từ các đơn đã hoàn thành (VNĐ)
- `averageOrderValue`: Giá trị trung bình mỗi đơn hàng đã hoàn thành (VNĐ)
- `orderIds`: Danh sách ID của tất cả các đơn hàng trong ngày

------------------------------------------------------------------------------------------------------



=====
DISCOUNT
=====
| POST | `/api/discounts` | Tạo mã giảm giá (Chỉ ADMIN OR STAFF) |
ví dụ payload
```json
{
  "code": "SUMMER2025",
  "description": "Giảm giá mùa hè 2025",
  "discountPercent": 20,
  "minOrderAmount": 100000,
  "maxDiscountAmount": 50000,
  "startDate": "2025-06-01T00:00:00",
  "endDate": "2025-08-31T23:59:59",
  "usageLimit": 100
}
```

response
```json
{
    "id": "693313a4b8e7f12a3b4c5d6e",
    "code": "SUMMER2025",
    "description": "Giảm giá mùa hè 2025",
    "discountPercent": 20.0,
    "minOrderAmount": 100000.0,
    "maxDiscountAmount": 50000.0,
    "startDate": "2025-06-01T00:00:00",
    "endDate": "2025-08-31T23:59:59",
    "usageLimit": 100,
    "usageCount": 0,
    "active": true
}
```

| GET | `/api/discounts/693313a4b8e7f12a3b4c5d6e` | Lấy thông tin mã giảm giá theo ID (Chỉ ADMIN OR STAFF) |
response
```json
{
    "id": "693313a4b8e7f12a3b4c5d6e",
    "code": "SUMMER2025",
    "description": "Giảm giá mùa hè 2025",
    "discountPercent": 20.0,
    "minOrderAmount": 100000.0,
    "maxDiscountAmount": 50000.0,
    "startDate": "2025-06-01T00:00:00",
    "endDate": "2025-08-31T23:59:59",
    "usageLimit": 100,
    "usageCount": 0,
    "active": true
}
```

| GET | `/api/discounts/code/SUMMER2025` | Lấy thông tin mã giảm giá theo code (Chỉ ADMIN OR STAFF) |
response
```json
{
    "id": "693313a4b8e7f12a3b4c5d6e",
    "code": "SUMMER2025",
    "description": "Giảm giá mùa hè 2025",
    "discountPercent": 20.0,
    "minOrderAmount": 100000.0,
    "maxDiscountAmount": 50000.0,
    "startDate": "2025-06-01T00:00:00",
    "endDate": "2025-08-31T23:59:59",
    "usageLimit": 100,
    "usageCount": 5,
    "active": true
}
```

| GET | `/api/discounts` | Lấy tất cả mã giảm giá (Chỉ ADMIN OR STAFF) |
response
```json
[
    {
        "id": "693313a4b8e7f12a3b4c5d6e",
        "code": "SUMMER2025",
        "description": "Giảm giá mùa hè 2025",
        "discountPercent": 20.0,
        "minOrderAmount": 100000.0,
        "maxDiscountAmount": 50000.0,
        "startDate": "2025-06-01T00:00:00",
        "endDate": "2025-08-31T23:59:59",
        "usageLimit": 100,
        "usageCount": 5,
        "active": true
    },
    {
        "id": "693313b5c9f8g23b4c5d6e7f",
        "code": "NEWYEAR",
        "description": "Giảm giá năm mới",
        "discountPercent": 15.0,
        "minOrderAmount": 50000.0,
        "maxDiscountAmount": 30000.0,
        "startDate": "2025-01-01T00:00:00",
        "endDate": "2025-01-31T23:59:59",
        "usageLimit": 200,
        "usageCount": 50,
        "active": true
    }
]
```

| PUT | `/api/discounts/693313a4b8e7f12a3b4c5d6e` | Cập nhật mã giảm giá (Chỉ ADMIN OR STAFF) |
ví dụ payload
```json
{
  "code": "SUMMER2025",
  "description": "Giảm giá mùa hè 2025 - Cập nhật",
  "discountPercent": 25,
  "minOrderAmount": 100000,
  "maxDiscountAmount": 60000,
  "active": true
}
```

response
```json
{
    "id": "693313a4b8e7f12a3b4c5d6e",
    "code": "SUMMER2025",
    "description": "Giảm giá mùa hè 2025 - Cập nhật",
    "discountPercent": 25.0,
    "minOrderAmount": 100000.0,
    "maxDiscountAmount": 60000.0,
    "startDate": "2025-06-01T00:00:00",
    "endDate": "2025-08-31T23:59:59",
    "usageLimit": 100,
    "usageCount": 5,
    "active": true
}
```

| DELETE | `/api/discounts/693313a4b8e7f12a3b4c5d6e` | Xóa mã giảm giá (Chỉ ADMIN OR STAFF) |

------------------------------------------------------------------------------------------------------



=====
DISH ITEMS (Món trong combo)
=====
| POST | `/api/dish-items` | Tạo món trong combo (Chỉ ADMIN OR STAFF) |
ví dụ payload
```json
{
  "comboId": "6932fb811024662f11ad577b",
  "productId": "6932fb4e1024662f11ad577a",
  "quantity": 2
}
```

response
```json
{
    "id": "693314c5d0a9h34c5d6e8g9h",
    "comboId": "6932fb811024662f11ad577b",
    "productId": "6932fb4e1024662f11ad577a",
    "quantity": 2
}
```

| GET | `/api/dish-items/693314c5d0a9h34c5d6e8g9h` | Lấy thông tin món trong combo theo ID (PUBLIC) |
response
```json
{
    "id": "693314c5d0a9h34c5d6e8g9h",
    "comboId": "6932fb811024662f11ad577b",
    "productId": "6932fb4e1024662f11ad577a",
    "quantity": 2
}
```

| GET | `/api/dish-items/combo/6932fb811024662f11ad577b` | Lấy tất cả món theo combo ID (PUBLIC) |
response
```json
[
    {
        "id": "693314c5d0a9h34c5d6e8g9h",
        "comboId": "6932fb811024662f11ad577b",
        "productId": "6932fb4e1024662f11ad577a",
        "quantity": 2
    },
    {
        "id": "693314d6e1b0i45d6e9h0i1j",
        "comboId": "6932fb811024662f11ad577b",
        "productId": "6932fd61647cbf1cf45c37d9",
        "quantity": 1
    }
]
```

| GET | `/api/dish-items/product/6932fb4e1024662f11ad577a` | Lấy tất cả combo chứa món theo product ID (PUBLIC) |
response
```json
[
    {
        "id": "693314c5d0a9h34c5d6e8g9h",
        "comboId": "6932fb811024662f11ad577b",
        "productId": "6932fb4e1024662f11ad577a",
        "quantity": 2
    },
    {
        "id": "693314e7f2c1j56e7f0i2k3l",
        "comboId": "6932fc921024662f11ad577c",
        "productId": "6932fb4e1024662f11ad577a",
        "quantity": 3
    }
]
```

| GET | `/api/dish-items` | Lấy tất cả các món trong combo (PUBLIC) |
response
```json
[
    {
        "id": "693314c5d0a9h34c5d6e8g9h",
        "comboId": "6932fb811024662f11ad577b",
        "productId": "6932fb4e1024662f11ad577a",
        "quantity": 2
    },
    {
        "id": "693314d6e1b0i45d6e9h0i1j",
        "comboId": "6932fb811024662f11ad577b",
        "productId": "6932fd61647cbf1cf45c37d9",
        "quantity": 1
    },
    {
        "id": "693314e7f2c1j56e7f0i2k3l",
        "comboId": "6932fc921024662f11ad577c",
        "productId": "6932fb4e1024662f11ad577a",
        "quantity": 3
    }
]
```

| PUT | `/api/dish-items/693314c5d0a9h34c5d6e8g9h` | Cập nhật món trong combo (Chỉ ADMIN OR STAFF) |
ví dụ payload
```json
{
  "comboId": "6932fb811024662f11ad577b",
  "productId": "6932fb4e1024662f11ad577a",
  "quantity": 3
}
```

response
```json
{
    "id": "693314c5d0a9h34c5d6e8g9h",
    "comboId": "6932fb811024662f11ad577b",
    "productId": "6932fb4e1024662f11ad577a",
    "quantity": 3
}
```

| DELETE | `/api/dish-items/693314c5d0a9h34c5d6e8g9h` | Xóa món trong combo (Chỉ ADMIN OR STAFF) |

------------------------------------------------------------------------------------------------------



=====
PAYMENT
=====
| POST | `/api/payments` | Tạo thanh toán (Chỉ ADMIN OR STAFF) |
ví dụ payload
```json
{
  "orderId": "69330f8f17364e06252ede3a",
  "method": "CASH",
  "amount": 125000
}
```

response
```json
{
    "id": "693315f8g3d2k67f8g1j3k4m",
    "orderId": "69330f8f17364e06252ede3a",
    "method": "CASH",
    "amount": 125000.0,
    "status": "COMPLETED",
    "paidAt": "2025-12-18T10:30:45.123"
}
```

Các method thanh toán có thể sử dụng:
- `CASH` - Tiền mặt
- `CARD` - Thẻ
- `MOMO` - Ví MoMo
- `BANK_TRANSFER` - Chuyển khoản

| GET | `/api/payments/693315f8g3d2k67f8g1j3k4m` | Lấy thông tin thanh toán theo ID (Chỉ ADMIN OR STAFF) |
response
```json
{
    "id": "693315f8g3d2k67f8g1j3k4m",
    "orderId": "69330f8f17364e06252ede3a",
    "method": "CASH",
    "amount": 125000.0,
    "status": "COMPLETED",
    "paidAt": "2025-12-18T10:30:45.123"
}
```

| GET | `/api/payments/order/69330f8f17364e06252ede3a` | Lấy tất cả thanh toán theo order ID (Chỉ ADMIN OR STAFF) |
response
```json
[
    {
        "id": "693315f8g3d2k67f8g1j3k4m",
        "orderId": "69330f8f17364e06252ede3a",
        "method": "CASH",
        "amount": 100000.0,
        "status": "COMPLETED",
        "paidAt": "2025-12-18T10:30:45.123"
    },
    {
        "id": "693316h9i4e3l78g9h2k4l5n",
        "orderId": "69330f8f17364e06252ede3a",
        "method": "CARD",
        "amount": 25000.0,
        "status": "COMPLETED",
        "paidAt": "2025-12-18T10:31:15.456"
    }
]
```

| GET | `/api/payments` | Lấy tất cả thanh toán (Chỉ ADMIN OR STAFF) |
response
```json
[
    {
        "id": "693315f8g3d2k67f8g1j3k4m",
        "orderId": "69330f8f17364e06252ede3a",
        "method": "CASH",
        "amount": 125000.0,
        "status": "COMPLETED",
        "paidAt": "2025-12-18T10:30:45.123"
    },
    {
        "id": "693316h9i4e3l78g9h2k4l5n",
        "orderId": "69330fa017364e06252ede3b",
        "method": "MOMO",
        "amount": 200000.0,
        "status": "COMPLETED",
        "paidAt": "2025-12-18T11:15:30.789"
    }
]
```

| DELETE | `/api/payments/693315f8g3d2k67f8g1j3k4m` | Xóa thanh toán (Chỉ ADMIN OR STAFF) |

------------------------------------------------------------------------------------------------------



## Các Query Parameters Hữu Ích

### Lấy món ăn theo danh mục
```
GET /api/dishes?categoryId=6932f6c8aa07ce07d7f5edfa
```

### Lấy món ăn còn hàng
```
GET /api/dishes?available=true
```

### Lấy order theo bàn
```
GET /api/orders?tableId=6932f42aaa07ce07d7f5edf6
```

### Lấy tổng hợp đơn hàng trong ngày
```
GET /api/orders/summary/daily
```

### Lấy tổng hợp đơn hàng theo ngày cụ thể
```
GET /api/orders/summary/daily?date=2025-12-18
```

### Lấy tất cả bàn (PUBLIC)
```
GET /api/tables
```

### Lấy tất cả danh mục (PUBLIC)
```
GET /api/categories
```

### Lấy tất cả món ăn
```
GET /api/dishes
```

### Lấy danh sách users theo role
```
GET /api/users?role=STAFF
GET /api/users?role=ADMIN
```

### Lấy tất cả users
```
GET /api/users
```

------------------------------------------------------------------------------------------------------



## Trạng thái Order (Status)

Các trạng thái order có thể sử dụng khi cập nhật:
- `NEW` - Đơn hàng mới
- `PREPARING` - Đang chuẩn bị
- `READY` - Sẵn sàng phục vụ
- `SERVED` - Đã phục vụ
- `COMPLETED` - Hoàn thành
- `CANCELLED` - Đã hủy

------------------------------------------------------------------------------------------------------



## Lưu Ý Quan Trọng

### Hệ Thống Phân Quyền
**Roles trong hệ thống:**
- **ADMIN**: Quản trị viên cao nhất
  - Có quyền truy cập tất cả endpoints
  - Là người duy nhất có thể tạo tài khoản mới (tạo tài khoản STAFF)
  - Quản lý toàn bộ hệ thống
  
- **STAFF**: Nhân viên
  - Có quyền quản lý đơn hàng, món ăn, bàn, danh mục, thanh toán, giảm giá
  - Không thể tạo tài khoản mới
  - Truy cập hầu hết các endpoints quản lý

**⚠️ LƯU Ý:** Hệ thống không còn role MEMBER. Chỉ có ADMIN và STAFF.

### Authentication
- Hầu hết các API đều yêu cầu JWT token trong header: `Authorization: Bearer {accessToken}`
- Token có thời hạn 24 giờ (accessToken) và 7 ngày (refreshToken)
- Khi accessToken hết hạn, sử dụng endpoint `/api/auth/refresh` để lấy token mới

### Public Endpoints (Không cần token)
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/orders` - Tạo order mới (ai cũng có thể đặt order)
- `GET /api/dishes` - Lấy danh sách món ăn
- `GET /api/dishes/{id}` - Lấy thông tin món ăn theo ID
- `GET /api/tables` - Lấy danh sách bàn
- `GET /api/tables/{id}` - Lấy thông tin bàn theo ID
- `GET /api/categories` - Lấy danh sách danh mục
- `GET /api/categories/{id}` - Lấy thông tin danh mục theo ID

### Protected Endpoints (Cần token và role)
- **Chỉ ADMIN:**
  - `POST /api/auth/register` - Tạo tài khoản mới cho STAFF
  - `GET /api/users` - Quản lý users
  - `PUT /api/users/{id}` - Cập nhật thông tin user
  - `PUT /api/users/{id}/status` - Cập nhật trạng thái user

- **ADMIN & STAFF:**
  - `POST/PUT/DELETE /api/dishes/**` - Quản lý món ăn
  - `POST/PUT/DELETE /api/tables/**` - Quản lý bàn
  - `POST/PUT/DELETE /api/categories/**` - Quản lý danh mục
  - `POST/PUT/DELETE /api/orders/**` - Quản lý đơn hàng
  - `POST/PUT/DELETE /api/payments/**` - Quản lý thanh toán
  - `POST/PUT/DELETE /api/discounts/**` - Quản lý giảm giá
  - `POST/PUT/DELETE /api/dish-items/**` - Quản lý món trong combo

### Quy Trình Tạo Tài Khoản
1. Tài khoản ADMIN đầu tiên phải được tạo trực tiếp trong database
2. ADMIN đăng nhập vào hệ thống
3. ADMIN sử dụng endpoint `/api/auth/register` để tạo tài khoản STAFF
4. STAFF đăng nhập và làm việc với quyền hạn được phép

### Error Response Format
```json
{
    "success": false,
    "message": "Error message here",
    "data": null
}
```

### Success Response Format
```json
{
    "success": true,
    "message": "Success message here",
    "data": { /* response data */ }
}
```

---

## Xử Lý Lỗi Thường Gặp

### 1. Port đã được sử dụng

**Lỗi**: `Port 8017 is already in use`

**Giải pháp**:
```bash
# Windows - Tìm process đang dùng port
netstat -ano | findstr :8017

# Kill process
taskkill /PID <PID> /F
```

### 2. MongoDB connection failed

**Lỗi**: `MongoTimeoutException`

**Giải pháp**:
- Kiểm tra connection string trong `application.yml`
- Đảm bảo IP của bạn được whitelist trong MongoDB Atlas
- Kiểm tra username/password

### 3. CORS Error

**Lỗi**: `Access-Control-Allow-Origin`

**Giải pháp**: Đảm bảo `SecurityConfig.java` có cấu hình CORS cho `http://localhost:5173`

### 4. JWT Token Invalid

**Lỗi**: `401 Unauthorized`

**Giải pháp**:
- Xóa localStorage trong browser
- Đăng nhập lại
- Kiểm tra JWT secret trong `application.yml`

---

## Build Production

### Backend:
```bash
cd backend
mvn clean package -DskipTests
```
Output: `backend/target/rms-0.0.1-SNAPSHOT.jar`

### Chạy JAR file:
```bash
java -jar backend/target/rms-0.0.1-SNAPSHOT.jar
```

---

## Công Nghệ Sử Dụng

### Backend
- **Spring Boot 3.2** - Framework
- **Spring Security** - Authentication
- **Spring Data MongoDB** - Database
- **JWT** - Token authentication
- **Lombok** - Code generation

