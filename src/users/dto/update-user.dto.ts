import { IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  firstName: string;
  @IsString()
  @MinLength(2)
  lastName: string;
  @IsString()
  avatarUrl: string;
  @IsString()
  bio: string;
}
