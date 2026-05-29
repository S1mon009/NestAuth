import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for the forgot password request.
 * Contains the email address of the user requesting a password reset.
 * This DTO is used to validate and standardize the input for the forgot password endpoint.
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user requesting a password reset',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
