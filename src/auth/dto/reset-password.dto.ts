import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token for resetting the password',
    example: 'reset-token-123',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
