import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract cookies from the request object.
 * Allows you to easily access cookies in your controllers.
 * @param {string} data Optional cookie name to retrieve a specific cookie. If not provided, returns all cookies.
 * @param {ExecutionContext} ctx Execution context to access the request object.
 * Usage: @Cookies('cookieName') to get a specific cookie or @Cookies() to get all cookies.
 * @example
 * // In your controller method
 * @Get('some-endpoint')
 * someMethod(@Cookies('sessionId') sessionId: string) {
 *   // Use sessionId cookie value
 * }
 */
export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return data ? request.cookies?.[data] : request.cookies;
  },
);
