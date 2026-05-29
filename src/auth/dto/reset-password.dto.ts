import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for the reset password request.
 * Contains the new password for the user.
 * This DTO is used to validate and standardize the input for the reset password endpoint.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token for resetting the password',
    example: 'reset-token-123',
  })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}
