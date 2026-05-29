import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for the registration request.
 * Contains the email address and password of the user.
 * This DTO is used to validate and standardize the input for the registration endpoint.
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Password of the user', example: 'password123' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password!: string;
}
