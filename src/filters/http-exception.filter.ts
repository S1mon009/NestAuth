import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to catch all unhandled exceptions and return a consistent error response format.
 * This filter will catch both HTTP exceptions and any other unhandled exceptions, ensuring that the client receives a structured error response.
 * The response includes the status code, timestamp, request path, and error message.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * Catches unhandled exceptions and returns a consistent error response.
   * @param {unknown} exception The caught exception.
   * @param {ArgumentsHost} host The arguments host.
   * @returns {void} No return value, as the response is sent directly to the client.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        message = res.message || message;
      }
    }

    this.logger.error('🔥 Exception:', exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
