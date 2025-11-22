# NestAuth - A NestJS Authentication App
![Static Badge](https://img.shields.io/badge/nestjs-nestjs?style=for-the-badge&logo=nestjs&color=%23E0234E) ![Static Badge](https://img.shields.io/badge/typescript-nestjs?style=for-the-badge&logo=typescript&logoColor=%23fefefe&color=%233178C6) 
![Static Badge](https://img.shields.io/badge/mongodb-mongodb?style=for-the-badge&logo=mongodb&logoColor=%23fefefe&color=%2347A248) ![Static Badge](https://img.shields.io/badge/mongoose-mongoose?style=for-the-badge&logo=mongoose&logoColor=%23fefefe&color=%23880000)
![Static Badge](https://img.shields.io/badge/mailtrap-mailtrap?style=for-the-badge&logo=mailtrap&logoColor=%23fefefe&color=%2322D172) ![Static Badge](https://img.shields.io/badge/prettier-prettier?style=for-the-badge&logo=prettier&logoColor=%23333&color=%23F7B93E)
![Static Badge](https://img.shields.io/badge/eslint-eslint?style=for-the-badge&logo=eslint&logoColor=%23fefefe&color=%234B32C3) ![Static Badge](https://img.shields.io/badge/npm-npm?style=for-the-badge&logo=npm&logoColor=%23fefefe&color=%23CB3837)
![Static Badge](https://img.shields.io/badge/env-env?style=for-the-badge&logo=dotenv&logoColor=%23333&color=%23ECD53F) 

NestAuth is a backend application built with **NestJS**, providing a full-featured authentication system including **registration, login, email verification, JWT-based authorization**, and **MongoDB integration**. 
Passwords are hashed with **bcrypt**, and verification emails are sent using **Mailtrap**.

---

## 🔹 Features

- User registration with password hashing
- Email verification after registration
- User login and JWT token generation
- Refresh token mechanism
- Forgot password mechanism
- Protected routes requiring JWT authentication
- MongoDB as the database
- Input validation with `class-validator`
- User roles (`user`, `admin`) comming soon

---

## 🛠 Technologies

- [NestJS](https://nestjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT (@nestjs/jwt, jsonwebtoken)](https://www.npmjs.com/package/@nestjs/jwt)
- [bcrypt](https://www.npmjs.com/package/bcrypt)
- [Nodemailer](https://nodemailer.com/)
- [Postman](https://www.postman.com/) for API testing
- [Mailtrap](https://mailtrap.io) for SMTP

---

## ⚡ Installation

### 1. Clone the repository:
```bash
git clone https://github.com/S1mon009/NestAuth.git
cd NestAuth
```
### 2. Install dependencies:
```bash
npm install
```
### 3. Configure the `.env` file in the project root:
```env
MONGO_URI=your_mongodb_uri

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=86400  # time in seconds (24h)
JWT_RESET_PASSWORD_EXPIRES_IN=900 # time in seconds (15m)

REFRESH_TOKEN_SECRET=anothersupersecretkey
REFRESH_TOKEN_EXPIRES_IN=604800 #time in seconds (7d)

# Mailtrap
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=YOUR_MAILTRAP_USERNAME
SMTP_PASS=YOUR_MAILTRAP_PASSWORD

REDIRECT_TO_VERIFY_EMAIL=your_redirect_url_to_verify_email
FRONTEND_URL=your_frontend_url
```
### 4. Start the application
```bash
npm run start:dev
```
The backend will run at `http://localhost:3000`.

---

## 📌 API Endpoints
### 1. Register
```arduino
POST /auth/register
```
Request body:
```json
{
  "email": "test@example.com",
  "password": "YourPassword"
}
```
Response:
```json
{
  "message": "User registered successfully, verification email sent"
}
```
The verification link will be send to mailtrap inbox.
### 2. Verify email
```arduino
GET /auth/verify-email?token=<JWT_TOKEN>
```
Response:
```json
{
  "message": "Email verified successfully"
}
```
### 3. Login
```arduino
POST /auth/login
```
Request body:
```json
{
  "email": "test@example.com",
  "password": "YourPassword"
}
```
Response:
```json
{
    "accessToken": "<ACCESS_TOKEN",
    "refreshToken": "<REFRESH_TOKEN>"
}
```
These tokens are used for user authentication.
### 4. Refresh token
```arduino
POST /auth/refresh-token
```
Request body:
```json
{
  "refreshToken": "<REFRESH_TOKEN>"
}
```
Response:
```json
{
    "accessToken": "<ACCESS_TOKEN",
    "refreshToken": "<REFRESH_TOKEN>"
}
```
### 5. Profile (protected)
```arduino
GET /auth/profile
```
Headers:
```bash
Authorization: Bearer <ACCESS_TOKEN>
```
Response:
```json
{
  "_id": "123456789",
  "email": "test@example.com",
  "role": "user",
  "isVerified": true
}
```

---

## 🔧 Notes
- Passwords are hashed using bcrypt with saltRounds = 12.
- JWT tokens expire based on .env configuration (JWT_EXPIRES_IN).
- Users must verify their email to access protected routes.
- The project will be extended with password reset, admin roles and social login.


