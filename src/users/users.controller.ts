import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProfileDocument, Profile } from './schemas/profile.schema';
import { UserDocument, User } from './schemas/user.schema';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles as RolesDecorator } from './decorators/roles.decorator';
import { Roles } from './enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles-auth.guard';
import { type RequestWithUser } from './interfaces/request-with-user.interface';
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  AddUserDto,
  AddUserResponseDto,
  UpdateUserResponseDto,
  UpdateUserRoleResponseDto,
} from './dto';

/**
 * UsersController handles all user-related operations such as creating users, retrieving user profiles, and updating user information. It includes endpoints for both regular users and administrators, with appropriate access controls and rate limiting to ensure security and performance. The controller uses JWT authentication and role-based authorization to protect sensitive operations, and it provides detailed API documentation using Swagger decorators.
 * @remarks The controller includes rate limiting on certain endpoints to prevent abuse, cache management, and uses Swagger decorators to document the API for better developer experience.
 */
@ApiTags('Users')
@ApiInternalServerErrorResponse({
  description: 'An unexpected error occurred while processing the request',
})
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  /**
   * Creates an instance of UsersController.
   * @param {UsersService} usersService The service responsible for handling user-related business logic, such as creating users, retrieving user profiles, and updating user information. It interacts with the database and other services to perform these operations.
   * @remarks The UsersController relies on the UsersService to perform all user-related operations, ensuring a separation of concerns and keeping the controller focused on handling HTTP requests and responses.
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user.
   * @param {AddUserDto} dto The data transfer object containing user information.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<AddUserResponseDto>} A promise resolving to the created user.
   * @throws {ForbiddenException} If the authenticated user does not have admin privileges.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint is restricted to administrators only. It allows admins to create new users with specified roles. The endpoint is protected by JWT authentication and role-based authorization, and it includes rate limiting to prevent abuse. The API documentation provides details about the expected request body and possible responses.
   * @example
   * // Request URL
   * POST /users/add
   * // Request Body
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123",
   *   "role": "USER"
   * }
   * // Successful Response
   * Status: 201 Created
   * {
   *   "message": "User created successfully"
   * }
   * // Error Response (Email already exists)
   * Status: 400 Bad Request
   * {
   *   "message": "Email already exists"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/add",
   *  "message": "Too many password reset requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user (Admin only)',
    description: 'Endpoint for admins to create new users with specified roles',
  })
  @ApiBody({
    type: AddUserDto,
    description: 'Data transfer object for creating a new user',
  })
  @ApiOkResponse({
    description: 'User created successfully',
    type: AddUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email already exists',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  create(
    @Body() dto: AddUserDto,
    @Req() req: RequestWithUser,
  ): Promise<AddUserResponseDto> {
    return this.usersService.createUser(
      dto.email,
      dto.password,
      dto.role || Roles.USER,
      req.user.userId,
    );
  }

  /**
   * Retrieves all users.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<UserDocument[]>} A promise resolving to the list of all users.
   * @throws {ForbiddenException} If the authenticated user does not have admin privileges.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint is restricted to administrators only. It allows admins to view all users in the system. The endpoint is protected by JWT authentication and role-based authorization, and it includes rate limiting to prevent abuse. The API documentation provides details about the possible responses.
   * @example
   * //Request URL
   * GET /users/all
   * //Successful Response
   * Status: 200 OK
   * [{
   *  "_id":  “<id>",
   *  "email": "<email>",
   *  "role": "<role>",
   *  "isVerified": true | false,
   *  "createdAt": "<timestap>",
   *  "updatedAt": "<timestap>"
   * }]
   * //Error Response (Unauthorized)
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/all",
   *   "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/all",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @UseInterceptors(CacheInterceptor)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Endpoint for admins to view all users',
  })
  @ApiOkResponse({
    description: 'List of all users',
    type: User,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  findAll(@Req() req: RequestWithUser): Promise<UserDocument[]> {
    return this.usersService.getAllUser(req.user.userId);
  }

  /**
   * Get user data for the currently authenticated user.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<UserDocument>} A promise resolving to the user data.
   * @throws {UnauthorizedException} If the user is not authenticated or does not have a valid JWT token.
   * @throws {NotFoundException} If the user is not found in the database.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint allows authenticated users to retrieve their own user data. It is protected by JWT authentication and includes rate limiting to prevent abuse. The API documentation provides details about the possible responses, including successful retrieval of user data and various error scenarios.
   * @example
   * //Request URL
   * GET /users/me
   * //Successful Response
   * Status: 200 OK
   * {
   *  "_id":  “<id>",
   *  "email": "<email>",
   *  "role": "<role>",
   *  "isVerified": true | false,
   *  "createdAt": "<timestap>",
   *  "updatedAt": "<timestap>"
   * }
   * // Error response for invalid credentials
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/me",
   *   "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/me",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/me",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @UseInterceptors(CacheInterceptor)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Endpoint to retrieve the profile of the currently authenticated user',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: User,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  getMe(@Req() req: RequestWithUser): Promise<UserDocument> {
    const userId = req.user.userId;
    return this.usersService.getOneUserByID(userId);
  }

  /**
   * Get a user by their ID.
   * @param {string} id The ID of the user to retrieve.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<UserDocument>} A promise resolving to the user data.
   * @throws {ForbiddenException} If the authenticated user does not have admin privileges.
   * @throws {UnauthorizedException} If the user is not authenticated or does not have a valid JWT token.
   * @throws {NotFoundException} If the user is not found in the database.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint allows administrators to retrieve a specific user by their ID. It is protected by JWT authentication and role-based authorization, ensuring that only admins can access this information. The endpoint includes rate limiting to prevent abuse, and the API documentation provides details about the expected parameters and possible responses, including successful retrieval of user data and various error scenarios.
   * @example
   * //Request URL
   * GET /users/<id>
   * //Successful Response
   * Status: 200 OK
   * {
   *  "_id":  “<id>",
   *  "email": "<email>",
   *  "role": "<role>",
   *  "isVerified": true | false,
   *  "createdAt": "<timestap>",
   *  "updatedAt": "<timestap>"
   * }
   * // Error response for invalid credentials
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/<id>",
   *   "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID (Admin only)',
    description: 'Endpoint for admins to retrieve a specific user by their ID',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<UserDocument> {
    return this.usersService.getOneUserByID(id, req.user.userId);
  }

  /**
   * Get a user's profile by their ID.
   * @param {string} id The ID of the user whose profile to retrieve.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<ProfileDocument>} A promise resolving to the user's profile data.
   * @throws {ForbiddenException} If the authenticated user does not have permission to view the requested profile.
   * @throws {UnauthorizedException} If the user is not authenticated or does not have a valid JWT token.
   * @throws {NotFoundException} If the user is not found in the database.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint allows users to view their own profile or for admins to view any user profile. It is protected by JWT authentication and role-based authorization, ensuring that only authorized users can access this information. The endpoint includes rate limiting to prevent abuse, and the API documentation provides details about the expected parameters and possible responses, including successful retrieval of user profile data and various error scenarios.
   * @example
   * //Request URL
   * GET /users/profile/<id>
   * //Successful Response
   * Status: 200 OK
   * {
   *  "_id":  “<id>",
   *  "userId": "<userId>",
   *  "firstName": "<firstName>",
   *  "lastName": "<lastName>",
   *  "avatarUrl": "<avatarUrl>",
   *  "bio": "<bio>",
   *  "createdAt": "<timestap>",
   *  "updatedAt": "<timestap>"
   * }
   * // Error response for invalid input
   * Status: 400 Bad Request
   * {
   *   "statusCode": 400,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/profile/<id>",
   *   "message": "Email already exists"
   * }
   * //Error Response (Unauthorized)
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/profile/<id>",
   *   "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/profile/<id>",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/profile/<id>",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.USER, Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @UseInterceptors(CacheInterceptor)
  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user profile (User or Admin only)',
    description:
      'Endpoint for users to view their own profile or for admins to view any user profile',
  })
  @ApiParam({
    description: 'The ID of the user whose profile to view',
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: Profile,
  })
  @ApiNotFoundResponse({
    description: 'User profile not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  async getUserProfile(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ProfileDocument> {
    if (req.user.role !== Roles.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot view this profile');
    }

    if (req.user.role === Roles.ADMIN) {
      await this.usersService.getUserProfile(id, req.user.userId);
    }

    return this.usersService.getUserProfile(id);
  }

  /**
   * Update a user's profile by their ID.
   * @param {string} id The ID of the user whose profile to update.
   * @param {Partial<UpdateUserDto>} dto The data transfer object containing the updated user information.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<UpdateUserResponseDto>} A promise resolving to the updated user profile data.
   * @throws {ForbiddenException} If the authenticated user does not have permission to update the requested profile.
   * @throws {UnauthorizedException} If the user is not authenticated or does not have a valid JWT token.
   * @throws {NotFoundException} If the user is not found in the database.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint allows users to update their own profile or for admins to update any user profile. It is protected by JWT authentication and role-based authorization, ensuring that only authorized users can access this information. The endpoint includes rate limiting to prevent abuse, and the API documentation provides details about the expected parameters and possible responses, including successful update of user profile data and various error scenarios.
   * @example
   * //Request URL
   * PATCH /users/profile/<id>
   * //Successful Response
   * Status: 200 OK
   * {
   *  "message": "User updated successfully"
   * }
   * // Error response for invalid input
   * Status: 400 Bad Request
   * {
   *   "statusCode": 400,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/profile/<id>",
   *   "message": "Email already exists"
   * }
   * //Error Response (Unauthorized)
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/users/profile/<id>",
   *   "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/profile/<id>",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/profile/<id>",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.USER, Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @Patch('profile/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    description: 'Data transfer object for updating a user',
    type: UpdateUserDto,
  })
  @ApiParam({
    description: 'The ID of the user to update',
    name: 'id',
    type: String,
  })
  @ApiOperation({
    summary: 'Update user (User or Admin only)',
    description:
      'Endpoint for users to update their own profile or for admins to update any user profile',
  })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UpdateUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided for user update',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  async updateUserProfile(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateUserDto>,
    @Req() req: RequestWithUser,
  ): Promise<UpdateUserResponseDto> {
    if (req.user.role !== Roles.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot update this user');
    }

    return this.usersService.updateUserProfile(id, dto, req.user.userId);
  }

  /**
   * Update a user's role by their ID.
   * @param {string} id The ID of the user whose role to update.
   * @param {UpdateUserRoleDto} dto The data transfer object containing the updated user role.
   * @param {RequestWithUser} req The request object containing the authenticated user's information.
   * @returns {Promise<UpdateUserRoleResponseDto>} A promise resolving to the updated user role data.
   * @throws {ForbiddenException} If the authenticated user does not have permission to update the requested role.
   * @throws {UnauthorizedException} If the user is not authenticated or does not have a valid JWT token.
   * @throws {NotFoundException} If the user is not found in the database.
   * @throws {TooManyRequestsException} If the user has made too many requests.
   * @remarks This endpoint allows admins to update the role of a specific user. It is protected by JWT authentication and role-based authorization, ensuring that only authorized users can access this information. The endpoint includes rate limiting to prevent abuse, and the API documentation provides details about the expected parameters and possible responses, including successful update of user role data and various error scenarios.
   * @example
   * //Request URL
   * PATCH /users/<id>/role
   * //Successful Response
   * Status: 200 OK
   * {
   *  "message": "User role updated successfully"
   * }
   * // Error response for invalid input
   * Status: 400 Bad Request
   * {
   *  "statusCode": 400,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>/role",
   *  "message": "Invalid data provided for user role update"
   * }
   * //Error Response (Unauthorized)
   * Status: 401 Unauthorized
   * {
   *  "statusCode": 401,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>/role",
   *  "message": "Unauthorized access - valid JWT token required"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>/role",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/users/<id>/role",
   *  "message": "Too many requests. Please try again later."
   * }
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @Throttle({ short: { limit: 3, ttl: 900000 } })
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    description: 'Data transfer object for updating user role',
    type: UpdateUserRoleDto,
  })
  @ApiParam({
    description: 'The ID of the user whose role to update',
    name: 'id',
    type: String,
  })
  @ApiOperation({
    summary: 'Update user role (Admin only)',
    description: 'Endpoint for admins to update the role of a specific user',
  })
  @ApiOkResponse({
    description: 'User role updated successfully',
    type: UpdateUserRoleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid data provided for user role update',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized access - valid JWT token required',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: RequestWithUser,
  ): Promise<UpdateUserRoleResponseDto> {
    return this.usersService.updateUserRole(id, dto.role, req.user.userId);
  }
}
