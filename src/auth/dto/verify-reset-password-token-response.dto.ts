import { ApiProperty } from '@nestjs/swagger';

export class VerifyResetPasswordTokenResponseDto {
  @ApiProperty({
    description: 'Indicates whether the reset password token is valid',
    example: 'Reset password token is valid.',
  })
  message: string;
}
