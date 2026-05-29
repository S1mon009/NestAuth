import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the reset password request.
 * Contains a message indicating whether the password reset was successful.
 * This DTO is used to standardize the response format for the reset password endpoint.
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Indicates whether the password reset was successful',
    example: 'Password reset successfully.',
  })
  message!: string;
}
