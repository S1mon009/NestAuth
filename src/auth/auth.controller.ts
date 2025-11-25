import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Query,
  Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { type Request } from 'express';
import { type RequestWithUser } from './interfaces/profile.interface';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
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
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const response = await this.authService.verifyEmail(token);

    if (response.redirect) {
      return res.redirect(response.redirect);
    }

    return res.json(response.message);
  }

  @Post('forgot-password')
  async forgotPasswordEndpoint(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-password')
  async verifyResetTokenEndpoint(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  async resetPasswordEndpoint(
    @Body() dto: ResetPasswordDto,
    @Query('token') token: string,
  ) {
    return this.authService.resetPassword(token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: RequestWithUser) {
    console.log(req.user);
    return req.user;
  }
}
