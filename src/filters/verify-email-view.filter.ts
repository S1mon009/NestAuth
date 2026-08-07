import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class VerifyEmailViewFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const body = exception.getResponse() as any;
    response.status(exception.getStatus()).render('verify-email', {
      //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      status: body.error as string,
    });
  }
}
