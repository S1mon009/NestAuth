import {
  Controller,
  Get,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LogDocument } from './schemas/log.schema';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles-auth.guard';
import { Roles as RolesDecorator } from '../users/decorators/roles.decorator';
import { Roles } from '../users/enums/roles.enum';

/**
 * Controller for handling log-related endpoints such as retrieving all logs and logs for a specific user.
 * @remarks The controller includes rate limiting on certain endpoints to prevent abuse, and uses Swagger decorators to document the API for better developer experience.
 */
@UseInterceptors(CacheInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(Roles.ADMIN)
@ApiTags('Authentication')
@ApiUnauthorizedResponse({
  description:
    'Unauthorized. Please provide a valid JWT token to access this resource.',
})
@ApiInternalServerErrorResponse({
  description: 'An unexpected error occurred while processing the request',
})
@Controller({ path: 'logs', version: '1' })
export class LogsController {
  /**
   * Creates an instance of the LogsController.
   * @param {LogsService} logsService The logs service that contains the business logic for handling log-related operations.
   */
  constructor(private readonly logsService: LogsService) {}

  /**
   * Retrieves all logs.
   * @returns {Promise<LogDocument[]>} A promise resolving to the list of all logs.
   * @remarks This endpoint is throttled to prevent abuse, allowing a maximum of 100 requests per hour.
   * @example
   * Request URL
   * GET /logs
   * // Successful response
   * Status: 200 OK
   * [
   *   {
   *     "_id": "<id>",
   *     "type": "info | warning  | error",
   *     "description": "<description>",
   *     "path": "<path>",
   *     "userId": "<userId | optional>",
   *     "createdAt": "<datatime>",
   *     "updatedAt": "<datatime>",
   *     "__v": 0
   *   }
   * ]
   * // Error response for invalid credentials
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/auth/login",
   *   "message": "Email not verified"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/reset-password",
   *  "message": "Too many password reset attempts. Please try again later."
   * }
   */
  @Throttle({ long: { limit: 100, ttl: 3600000 } })
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all logs' })
  @ApiOkResponse({ description: 'Logs retrieved successfully' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  findAll(): Promise<LogDocument[]> {
    return this.logsService.getAllLogs();
  }

  /**
   * Retrieves logs for a specific user.
   * @param {string} id The ID of the user for whom to retrieve logs.
   * @returns {Promise<LogDocument[]>} A promise resolving to the list of logs for the specified user.
   * @remarks This endpoint is throttled to prevent abuse, allowing a maximum of 50 requests per hour.
   * @example
   * Request URL
   * GET /logs/user/user-id-1
   * // Successful response
   * Status: 200 OK
   * [
   *   {
   *     "_id": "<id>",
   *     "type": "info | warning  | error",
   *     "description": "<description>",
   *     "path": "<path>",
   *     "userId": "<userId | optional>",
   *     "createdAt": "<datatime>",
   *     "updatedAt": "<datatime>",
   *     "__v": 0
   *   }
   * ]
   * // Error response for invalid credentials
   * Status: 401 Unauthorized
   * {
   *   "statusCode": 401,
   *   "timestamp": "<timestamp>",
   *   "path": "/v1/auth/login",
   *   "message": "Email not verified"
   * }
   * // Error response for user not found
   * Status: 404 Not Found
   * {
   *  "statusCode": 404,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/verify-reset-password",
   *  "message": "User not found"
   * }
   * // Error response for too many requests
   * Status: 429 Too Many Requests
   * {
   *  "statusCode": 429,
   *  "timestamp": "<timestamp>",
   *  "path": "/v1/auth/reset-password",
   *  "message": "Too many password reset attempts. Please try again later."
   * }
   */
  @Throttle({ long: { limit: 50, ttl: 3600000 } })
  @Get('user/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve logs for a specific user' })
  @ApiOkResponse({ description: 'User logs retrieved successfully' })
  @ApiTooManyRequestsResponse({
    description: 'Too many requests. Please try again later.',
  })
  findUserLogs(@Param('id') id: string): Promise<LogDocument[]> {
    return this.logsService.getUserLogs(id);
  }
}
