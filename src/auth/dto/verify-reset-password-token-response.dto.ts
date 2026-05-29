import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the reset password token verification request.
 * Contains a message indicating whether the reset password token is valid.
 * This DTO is used to standardize the response format for the reset password token verification endpoint.
 */
export class VerifyResetPasswordTokenResponseDto {
  @ApiProperty({
    description: 'Indicates whether the reset password token is valid',
    example: 'Reset password token is valid.',
  })
  message!: string;
}
