import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the response of the registration request.
 * Contains a message indicating whether the registration was successful.
 * This DTO is used to standardize the response format for the registration endpoint.
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Indicates whether the registration was successful',
    example: 'User registered successfully.',
  })
  message!: string;
}
