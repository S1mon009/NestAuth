import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Indicates whether the registration was successful',
    example: 'User registered successfully.',
  })
  message: string;
}
