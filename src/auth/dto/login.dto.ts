import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Data Transfer Object for the login request.
 * Contains the email address and password of the user.
 * This DTO is used to validate and standardize the input for the login endpoint.
 */
export class LoginDto {
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
