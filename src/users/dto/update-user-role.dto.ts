import { IsEnum } from 'class-validator';
import { Roles } from '../enums/roles.enum';

export class UpdateUserRoleDto {
  @IsEnum(Roles)
  role: Roles;
}
