import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Roles } from '../enums/roles.enum';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Roles, description: 'The role to assign to the user' })
  @IsEnum(Roles)
  @IsNotEmpty()
  role!: Roles;
}
