import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Roles } from '../enums/roles.enum';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Roles })
  @IsEnum(Roles)
  @IsNotEmpty()
  role: Roles;
}
