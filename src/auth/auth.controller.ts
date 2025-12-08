import { Body, Controller, Post, Get, Req, Query, Res } from '@nestjs/common';
import { type Response } from 'express';
import { type Request } from 'express';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiBody({ type: RegisterDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('refresh-token')
  refreshToken(@Req() req: Request) {
    const refreshToken: string = req.cookies['refresh_token'];
    return this.authService.refreshToken(refreshToken);
  }

  @Get('verify-email')
  @ApiQuery({ name: 'token', type: String })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const response = await this.authService.verifyEmail(token);

    if (response.redirect) {
      return res.redirect(response.redirect);
    }

    return res.json(response.message);
  }

  @Post('forgot-password')
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPasswordEndpoint(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-password')
  @ApiQuery({ name: 'token', type: String })
  async verifyResetTokenEndpoint(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @ApiQuery({ name: 'token', type: String })
  async resetPasswordEndpoint(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ) {
    return this.authService.resetPassword(token, dto.newPassword);
  }
}
