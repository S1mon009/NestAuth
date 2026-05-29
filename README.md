# NestAuth

![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=for-the-badge&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-8.19.4-47A248?style=for-the-badge&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-jsonwebtoken-339933?style=for-the-badge&logo=jsonwebtokens)
![Swagger](https://img.shields.io/badge/Swagger-NestJS-61DAFB?style=for-the-badge&logo=swagger)

## Overview

NestAuth is a secure NestJS backend for authentication and user management. It implements:

- email-based registration and verification,
- JWT access token flow with refresh token support,
- password reset workflow,
- admin-level user management and profile handling.

The project is built with modular NestJS patterns, runtime validation, rate limiting, API versioning, and documentation support.

## Features

- User registration with email verification
- Login with JWT access token
- Refresh token rotation via HTTP-only cookie
- Forgot password and reset password flow
- Reset token validation endpoint
- Admin-only user creation and list access
- JWT-protected routes and role-based authorization
- Global validation and endpoint-level throttling
- API versioning under `/v1`
- Swagger UI and Compodoc support

## Technologies

- NestJS
- TypeScript
- MongoDB + Mongoose
- JWT (`@nestjs/jwt`, `jsonwebtoken`)
- Bcrypt
- Nodemailer + Mailtrap
- Helmet, cookie-parser, cache manager
- Swagger + Compodoc
- Jest + Supertest

## Prerequisites

- Node.js >= 20
- npm
- MongoDB instance
- SMTP provider (Mailtrap recommended)

## Installation

```bash
git clone https://github.com/S1mon009/NestAuth.git
cd NestAuth
npm install
```

## Environment Variables

Create a `.env` file in the project root and provide the required values:

```env
MONGO_URI=your_mongodb_uri
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
SERVER_URL=http://localhost
API_VERSION=v1
PORT=3000
CACHE_TTL=5000
BCRYPT_SALT=12
```

## Running the Application

```bash
npm run start:dev
```

The server runs on `http://localhost:3000` by default.

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api
```

## API Endpoints

Base route: `http://localhost:3000/v1`

### Authentication

- `POST /auth/register`
- `GET /auth/verify-email?token=<token>`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/verify-reset-password?token=<token>`
- `POST /auth/reset-password?token=<token>`

### Users

- `GET /users/me`
- `GET /users/all` (admin only)
- `POST /users/add` (admin only)
- `GET /users/profile/:id`
- `PATCH /users/profile/:id`

## Scripts

- `npm run start` — run the application
- `npm run start:dev` — run in development mode
- `npm run start:prod` — run production build
- `npm run build` — compile TypeScript
- `npm run lint` — lint project files
- `npm run lint:fix` — fix lint issues
- `npm run format` — format code with Prettier
- `npm run test` — run Jest tests
- `npm run test:watch` — run tests in watch mode
- `npm run test:cov` — run coverage
- `npm run compodoc` — start Compodoc server
- `npm run compodoc:build` — generate static docs

## Testing

```bash
npm run test
```

## Documentation

Generate static documentation:

```bash
npm run compodoc:build
```

Launch Compodoc server:

```bash
npm run compodoc
```

## Notes

- The project validates environment variables on startup.
- Refresh tokens are stored in HTTP-only cookies.
- Global rate limiting protects authentication workflows.
- A dedicated Swagger UI is provided for API exploration.

## License

`UNLICENSED`
