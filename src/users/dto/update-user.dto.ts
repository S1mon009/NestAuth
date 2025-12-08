import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  avatarUrl: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bio: string;
}
