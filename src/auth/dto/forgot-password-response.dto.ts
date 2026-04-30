import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description:
      'Indicates whether the password reset email was sent successfully',
    example: 'Password reset email sent successfully.',
  })
  message: string;
}
