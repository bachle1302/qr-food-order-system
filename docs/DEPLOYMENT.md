# Deployment Guide

This document describes how to deploy the QR Food Ordering & Restaurant Management System locally and in production/staging environments.

---

## 🐳 Local Deployment via Docker Compose

To start the entire fullstack system locally (including MongoDB, the backend API, and the Next.js frontend):

1. **Copy the default environment template**:
   ```bash
   cp .env.example .env
   ```
2. **Start the containers**:
   ```bash
   docker compose up --build -d
   ```
3. **Verify the services**:
   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend API: [http://localhost:8017](http://localhost:8017)

---

## ⚙️ Production / Staging Environment Variables

When deploying to a hosting provider or container orchestration tool in production, configure the following environment variables:

```env
SPRING_PROFILES_ACTIVE=prod
MONGODB_URI=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/qrfood?retryWrites=true&w=majority
JWT_SECRET=your-secure-base64-encoded-at-least-256bit-secret-key-here
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api-domain.com
APP_SEED_ENABLED=false
APP_RATE_LIMIT_ENABLED=true
```

> [!WARNING]
> Never commit `.env` or `.env.production` files containing real production secrets to version control.

---

## ⚠️ Important Production Architecture Notes

### 1. Network Namespaces and Hostnames
* **Internal Docker network**: In the `docker-compose.yml` config, the backend communicates with MongoDB using the internal Docker DNS name `mongodb`.
* **Public Browser access**: The Next.js frontend runs entirely in the customer's web browser. Therefore, `NEXT_PUBLIC_API_BASE_URL` **must** be a publicly resolvable URL (e.g., `https://api.yourdomain.com`), not an internal Docker network hostname (like `http://backend:8017`).
* **Avoid Localhost**: Do not use `localhost` in production variables unless the frontend and backend are hosted on the same physical host and properly reverse-proxied via Nginx or equivalent.

### 2. Rate Limiting in Production
* The default rate-limiting filter uses an **in-memory** token bucket. This is ideal for single-instance setups.
* For **horizontal scaling (multi-instance/clustered environments)**, migrate the rate-limiting storage to a centralized cache like **Redis** to ensure rate limits are synchronized across all running instances.

### 3. Cross-Origin Resource Sharing (CORS)
* Always set `CORS_ALLOWED_ORIGINS` to your exact frontend domain name (e.g., `https://your-frontend-domain.com`).
* **Never use wildcard (`*`)** for CORS in production because the authentication endpoints use credentials (cookies/authorization headers), which browsers reject when CORS is configured with a wildcard origin.
