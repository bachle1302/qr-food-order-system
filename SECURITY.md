# Security Policy

## Security Measures

This project implements industry-standard security practices for contactless dining and restaurant management:

- **Authentication & Authorization**: Handled via stateless JSON Web Tokens (JWT) with separate access/refresh lifecycles. Access control is enforced using Spring Security Role-Based Access Control (RBAC) separating administrative actions (`ADMIN`) from operational tasks (`STAFF`).
- **Rate Limiting**: Publicly accessible endpoints (e.g. guest check-in, menu browsing, ordering) are protected against spam and denial-of-service attempts by a built-in rate-limiting filter.
- **Account State Verification**: Active checks are performed on every request. If a user is deactivated (`isActive = false`), all active JWT tokens are instantly invalidated.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities. Instead:
- Report potential issues by contacting the repository maintainer directly via email (or open a confidential issue if supported).
- Ensure no real credentials, tokens, or private environment files (`.env`) are committed to this repository.

## Production Guidelines

- Always run in production with `SPRING_PROFILES_ACTIVE=prod`.
- Generate and use strong, unique values for `JWT_SECRET` and `MONGODB_URI` using environment variables. Never commit production credentials or `.env` files.
