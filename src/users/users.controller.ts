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
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddUserDto } from './dto/add-user.dto';
import { Roles as RolesDecorator } from './decorators/roles.decorator';
import { Roles } from './enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles-auth.guard';
import { type RequestWithUser } from './interfaces/request-with-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @ApiBody({ type: AddUserDto })
  create(@Body() dto: AddUserDto, @Req() req: RequestWithUser) {
    return this.usersService.createUserAdmin(
      dto.email,
      dto.password,
      dto.role || Roles.USER,
      req.user.userId,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  findAll(@Req() req: RequestWithUser) {
    return this.usersService.findAll(req.user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.usersService.findOneById(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.ADMIN)
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.usersService.findOneById(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(Roles.USER, Roles.ADMIN)
  @Patch(':id')
  @ApiBody({ type: UpdateUserDto })
  @ApiParam({ name: 'id', type: String })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateUserDto>,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.role !== Roles.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot update this user');
    }

    return this.usersService.updateUser(id, dto, req.user.userId);
  }

  @RolesDecorator(Roles.USER, Roles.ADMIN)
  @Get('profile/:id')
  @ApiParam({ name: 'id', type: String })
  async getUserProfile(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (req.user.role !== Roles.ADMIN && req.user.userId !== id) {
      throw new ForbiddenException('You cannot view this profile');
    }

    if (req.user.role === Roles.ADMIN) {
      await this.usersService.getUserProfile(id, req.user.userId);
    }

    return this.usersService.getUserProfile(id);
  }

  @RolesDecorator(Roles.ADMIN)
  @Patch(':id/role')
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiParam({ name: 'id', type: String })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.usersService.updateUserRole(id, dto.role, req.user.userId);
  }
}
