import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common/exceptions';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddUserDto } from './dto/add-user.dto';
import { Roles } from './decorators/roles.decorator';
import { Roles as Role } from './enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles-auth.guard';
import { type RequestWithProfile } from './interfaces/profile.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { type UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: AddUserDto, @Req() req: RequestWithProfile) {
    return this.usersService.createUserAdmin(
      dto.email,
      dto.password,
      dto.role || Role.USER,
      req.user.userId,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@Req() req: RequestWithProfile) {
    return this.usersService.findAll(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: RequestWithProfile) {
    const userId = req.user.userId;
    return this.usersService.findOneById(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string, @Req() req: RequestWithProfile) {
    return this.usersService.findOneById(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateUserDto>,
    @Req() req: RequestWithProfile,
  ) {
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot update this user');
    }

    return this.usersService.updateUser(id, dto, req.user.userId);
  }

  @Roles(Role.USER, Role.ADMIN)
  @Get('profile/:id')
  async getUserProfile(
    @Param('id') id: string,
    @Req() req: RequestWithProfile,
  ) {
    if (req.user.role !== Role.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot view this profile');
    }

    if (req.user.role === Role.ADMIN) {
      await this.usersService.getUserProfile(id, req.user.userId);
    }

    return this.usersService.getUserProfile(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: RequestWithProfile,
  ) {
    return this.usersService.updateUserRole(id, dto.role, req.user.userId);
  }
}
