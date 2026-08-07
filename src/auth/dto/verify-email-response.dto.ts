import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the email verification request.
 * Contains the status of the email verification process.
 * This DTO is used to standardize the response format for the email verification endpoint.
 */
export enum VerifyEmailStatus {
  VERIFIED = 'Email is verified',
  ALREADY_VERIFIED = 'Email is already verified',
  INVALID_OR_EXPIRED_TOKEN = 'Invalid or expired token',
}

/**
 * Data Transfer Object for the response of the email verification request.
 * Contains the status of the email verification process.
 * This DTO is used to standardize the response format for the email verification endpoint.
 */
export class VerifyEmailResponseDto {
  @ApiProperty({ enum: VerifyEmailStatus })
  status!: VerifyEmailStatus;
}
