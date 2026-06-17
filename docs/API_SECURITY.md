# API Security & Access Control

This document outlines the security architecture, endpoint permissions, rate-limiting rules, and operational constraints of the API.

---

## 🔑 Endpoint Classification

### 1. Public APIs (Guest Access)
These endpoints do not require a JWT token but are bound to a customer session or valid table QR token:
- **Table Lookup**: `GET /api/tables/qr/{qrToken}` (Retrieves seating info for a scanned table).
- **Customer Check-in**: `POST /api/customer-sessions/check-in` (Starts a new active dining session).
- **Menu & Dishes**: `GET /api/categories`, `GET /api/dishes` (Public menu access).
- **Public Ordering**: `POST /api/orders/public/qr` (Submits a guest order).
- **Order Status Tracking**: `GET /api/orders/public/session/{customerSessionId}` (Track status of orders in the current session).

### 2. Protected APIs (Authorized Staff & Admin)
Require a valid JWT header (`Authorization: Bearer <token>`):
- **Operational (ADMIN & STAFF)**:
  * Manage orders (`GET /api/orders`, `PUT /api/orders/{id}/status`, `POST /api/orders/{id}/pay`).
  * SSE connection for order updates (`GET /api/orders/stream`).
- **Administrative (ADMIN Only)**:
  * User/Staff CRUD (`/api/users/**`).
  * Table Configuration & QR Generation (`/api/tables/**` except public QR route).
  * Menu & Discount Configuration (`/api/dishes/**`, `/api/categories/**`, `/api/discounts/**` - POST/PUT/DELETE routes).

---

## 👥 Role Permissions Matrix

| Endpoint Route | HTTP Methods | ADMIN | STAFF | CUSTOMER / Guest |
| :--- | :--- | :---: | :---: | :---: |
| `/api/auth/**` | POST | ✅ | ✅ | ✅ (Login/Token refresh) |
| `/api/users/**` | GET, POST, PUT, DELETE | ✅ | ❌ | ❌ |
| `/api/tables/qr/**` | GET | ✅ | ✅ | ✅ |
| `/api/tables/**` | POST, PUT, DELETE | ✅ | ❌ | ❌ |
| `/api/dishes` & `/api/categories` | GET | ✅ | ✅ | ✅ |
| `/api/dishes/**` & `/api/categories/**` | POST, PUT, DELETE | ✅ | ❌ | ❌ |
| `/api/discounts/**` | POST, PUT, DELETE | ✅ | ❌ | ❌ |
| `/api/customer-sessions/check-in` | POST | ❌ | ❌ | ✅ |
| `/api/orders/public/**` | GET, POST | ❌ | ❌ | ✅ |
| `/api/orders` & `/api/orders/stream` | GET | ✅ | ✅ | ❌ |
| `/api/orders/{id}/status` & `/pay` | PUT, POST | ✅ | ✅ | ❌ |

---

## 🛡️ Rate Limiting Matrix

To prevent abuse, public endpoints are rate-limited. When a client exceeds the limit, the server responds with `429 Too Many Requests`.

| Public Endpoint | Rate Limit Threshold | Window | Purpose |
| :--- | :--- | :--- | :--- |
| `POST /api/customer-sessions/check-in` | **5 requests** | 1 minute | Prevents check-in session flooding |
| `POST /api/orders/public/qr` | **5 requests** | 1 minute | Prevents spam order creation |
| `GET /api/orders/public/session/{id}` | **20 requests** | 1 minute | Restricts aggressive status page refreshes |
| `GET /api/tables/qr/{qrToken}` | **15 requests** | 1 minute | Limits table details querying |

---

## 🔒 Inactive User Invalidation

- When an administrator deactivates an account (setting `isActive = false` on a `User`), the user can no longer request new JWT tokens.
- An interceptor filter checks the `isActive` state of the subject on **every** incoming request.
- If the account status is changed to inactive, any existing, otherwise-valid JWT tokens are **instantly rejected** with an `HTTP 403 Forbidden` response, preventing any subsequent administrative or operational access.
