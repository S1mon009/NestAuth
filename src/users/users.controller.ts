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
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddUserDto } from './dto/add-user.dto';
import { Roles } from './decorators/roles.decorator';
import { Roles as Role } from './enums/roles.enum';
import { RolesGuard } from '../auth/guards/roles-auth.guard';
import { type RequestWithProfile } from './interfaces/profile.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: AddUserDto) {
    return this.usersService.createUserAdmin(
      dto.email,
      dto.password,
      dto.role || Role.USER,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    console.log('Fetching all users');
    return this.usersService.findAll();
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
  findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
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
      throw new Error('Forbidden');
    }

    return this.usersService.updateUser(id, dto, req.user.userId);
  }
}
