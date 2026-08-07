# NestAuth

![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8.19.4-47A248?style=for-the-badge&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-jsonwebtoken-339933?style=for-the-badge&logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/Swagger-NestJS-61DAFB?style=for-the-badge&logo=swagger)

NestAuth is a secure, modular NestJS backend for authentication, user management, and application logging. It is designed for modern web applications that need a robust auth flow with email verification, password reset, JWT-based sessions, throttling, and admin-oriented user operations.

## Overview

This project provides a complete authentication layer with:

- user registration and email verification,
- login with access and refresh tokens,
- password reset via email,
- role-based access control for admin endpoints,
- structured logging and audit-friendly request tracking,
- Swagger-based API documentation and Compodoc output.

The API is versioned under `/v1` and is protected with validation, CORS configuration, rate limiting, and security headers.

## Key Features

- Registration flow with verification email
- JWT access tokens and refresh token rotation via HTTP-only cookies
- Password reset request and reset confirmation flow
- Admin-only user creation and user administration endpoints
- Protected profile and account management routes
- Centralized logging for auth and user-related actions
- Swagger UI available out of the box
- Test coverage with Jest

## Technology Stack

- NestJS 11
- TypeScript 5
- MongoDB + Mongoose
- JWT / Passport
- Bcrypt
- Nodemailer + Mailtrap
- Helmet, cookie-parser, cache-manager
- Swagger + Compodoc
- Jest + Supertest

## Prerequisites

Before running the project, make sure you have:

- Node.js 20 or newer
- npm
- A MongoDB instance
- An SMTP provider (Mailtrap is recommended for local development)

## Installation

```bash
git clone https://github.com/S1mon009/NestAuth.git
cd NestAuth
npm install
```

## Environment Configuration

Create a `.env` file in the project root with the following values. A ready-to-copy example is also available in `env.example`:

```env
MONGO_URI=mongodb://localhost:27017/nestauth
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=86400
JWT_RESET_PASSWORD_EXPIRES_IN=900
REFRESH_TOKEN_SECRET=anothersecretkey
REFRESH_TOKEN_EXPIRES_IN=604800
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=YOUR_MAILTRAP_USERNAME
SMTP_PASS=YOUR_MAILTRAP_PASSWORD
FRONTEND_URL=http://localhost:4200
CORS_ORIGIN=http://localhost:4200
API_VERSION=v1
PORT=3000
HOST=127.0.0.1
CACHE_TTL=5000
BCRYPT_SALT=12
```

> Important: `FRONTEND_URL` is required for password reset links. For email verification, the application can fall back to a built-in render view on the backend when `FRONTEND_URL` is not defined.

## Docker

Build the production image from the repository root:

```bash
docker build -t nestauth:latest -f docker/Dockerfile .
```

Run the container with the project environment file:

```bash
docker run --rm -d -p 3000:3000 --env-file .env --name nestauth nestauth:latest
```

The application will be available at:

```text
http://localhost:3000
```

Swagger UI is available at:

```text
http://localhost:3000/api
```

Useful commands:

```bash
docker logs nestauth
docker ps
docker rm -f nestauth
```

> Note: the container is configured to listen on `0.0.0.0`, so it is reachable from outside the container. If your MongoDB instance runs on the host machine, use a Docker-friendly host value such as `host.docker.internal` in `MONGO_URI`.

## Running the Application

Start the development server:

```bash
npm run start:dev
```

The backend will be available at:

```text
http://localhost:3000
```

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api
```

Compodoc documentation is also generated under the `documentation/` folder.

## API Overview

Base URL:

```text
http://localhost:3000/v1
```

### Authentication Endpoints

- `POST /auth/register`
- `GET /auth/verify-email?token=<token>`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/verify-reset-password?token=<token>`
- `POST /auth/reset-password?token=<token>`

### User Management Endpoints

- `GET /users/me`
- `GET /users/all` (admin only)
- `POST /users/add` (admin only)
- `GET /users/:id` (admin only)
- `GET /users/profile/:id`
- `PATCH /users/profile/:id`
- `PATCH /users/:id/role` (admin only)

### Logs Endpoints

- `GET /logs` (admin only)
- `GET /logs/user/:id` (admin only)

## Frontend URL Requirements

The project uses `FRONTEND_URL` when composing email links for:

- email verification: `${FRONTEND_URL}/auth/verify-email?token=...`
- password reset: `${FRONTEND_URL}/auth/reset-password?token=...`

If `FRONTEND_URL` is not defined, the verification flow still works because the application renders a default verification view on the backend for `/auth/verify-email`. For password reset, however, `FRONTEND_URL` is required, because the reset link must point to a frontend page that can collect the new password.

This means your frontend application should expose matching routes for these flows. In a typical setup:

- `/auth/verify-email?token=...` handles the verification flow
- `/auth/reset-password?token=...` handles the reset password flow

These links are generated by the email service and are sent to users after registration or password reset requests. The backend itself also exposes the corresponding API endpoints, but the frontend routes are the recommended integration point for user-facing flows.

### Recommended frontend flow

1. User registers via `POST /auth/register`.
2. The backend sends a verification email containing a link built from `FRONTEND_URL` when available; otherwise the backend renders the default verification view.
3. The frontend opens `/auth/verify-email?token=...` to complete the confirmation flow when using a dedicated frontend page.
4. For password recovery, the frontend opens `/auth/reset-password?token=...` after the reset email is received.

If you want to use the backend directly, the corresponding API routes are also available under `/v1/auth/verify-email` and `/v1/auth/reset-password`.

## Scripts

- `npm run start` — start the application
- `npm run start:dev` — start in development mode with watch mode
- `npm run start:prod` — run the compiled production build
- `npm run build` — compile the TypeScript project
- `npm run lint` — run ESLint
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — format the codebase with Prettier
- `npm run test` — run Jest tests
- `npm run test:watch` — run tests in watch mode
- `npm run test:cov` — run tests with coverage
- `npm run compodoc` — generate and serve Compodoc documentation

## Testing

Run the test suite:

```bash
npm run test
```

## Documentation

Generate the static documentation bundle:

```bash
npm run compodoc
```

The generated docs are stored in the `documentation/` directory.

## Security Notes

- Refresh tokens are stored in HTTP-only cookies.
- Authentication endpoints are protected by rate limiting.
- Request payloads are validated with DTOs and Nest validation pipes.
- Security headers are enabled with Helmet.
- Access to sensitive endpoints is controlled by JWT and role guards.
