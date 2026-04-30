import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Indicates whether the password reset was successful',
    example: 'Password reset successfully.',
  })
  message: string;
}
