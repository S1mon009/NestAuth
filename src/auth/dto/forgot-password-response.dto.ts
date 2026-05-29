import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the forgot password request.
 * Contains a message indicating the result of the password reset email sending process.
 * This DTO is used to standardize the response format for the forgot password endpoint.
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description:
      'Indicates whether the password reset email was sent successfully',
    example: 'Password reset email sent successfully.',
  })
  message!: string;
}
