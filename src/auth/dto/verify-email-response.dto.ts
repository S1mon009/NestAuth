import { ApiProperty } from '@nestjs/swagger';

export enum VerifyEmailStatus {
  VERIFIED = 'VERIFIED',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  INVALID_OR_EXPIRED_TOKEN = 'INVALID_OR_EXPIRED_TOKEN',
}

export class VerifyEmailResponseDto {
  @ApiProperty({ enum: VerifyEmailStatus })
  status: VerifyEmailStatus;
}
