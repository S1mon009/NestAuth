import { IsEmail, IsString, MinLength } from 'class-validator';
import { Roles } from '../enums/roles.enum';

export class AddUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  role?: Roles | undefined;
}
