import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the email verification request.
 * Contains the status of the email verification process.
 * This DTO is used to standardize the response format for the email verification endpoint.
 */
export enum VerifyEmailStatus {
  VERIFIED = 'VERIFIED',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  INVALID_OR_EXPIRED_TOKEN = 'INVALID_OR_EXPIRED_TOKEN',
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
