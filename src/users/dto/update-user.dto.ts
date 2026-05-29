import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: "The user's first name" })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ description: "The user's last name" })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({ description: "The URL of the user's avatar" })
  @IsString()
  avatarUrl!: string;

  @ApiProperty({ description: 'A brief bio for the user' })
  @IsString()
  bio!: string;
}
