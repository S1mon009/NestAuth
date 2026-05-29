import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Roles } from '../enums/roles.enum';

export class AddUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email address of the user to be created.',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'The password for the user account.',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    required: false,
    enum: Roles,
    description: 'The role assigned to the user.',
  })
  role?: Roles | undefined;
}
