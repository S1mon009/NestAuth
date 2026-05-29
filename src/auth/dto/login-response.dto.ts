import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for the user information included in the login response.
 * Contains the unique identifier, email address, and role of the user.
 * This DTO is used to standardize the user information format in the login response.
 */
export class UserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '64b8f0c2e1d2c3a4b5c6d7e',
  })
  userId!: string;
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email!: string;
  @ApiProperty({
    description: 'Role of the user',
    example: 'admin',
  })
  role!: string;
}

/**
 * Data Transfer Object for the login response.
 * Contains the access token, refresh token, and user information.
 * This DTO is used to standardize the login response format.
 */
export class LoginServiceResponseDto {
  @ApiProperty({
    description: 'The access token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;
  @ApiProperty({
    description: 'The refresh token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refreshToken!: string;
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}

/**
 * Data Transfer Object for the login response.
 * Contains the access token and user information.
 * This DTO is used to standardize the login response format for the login endpoint.
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'The access token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
