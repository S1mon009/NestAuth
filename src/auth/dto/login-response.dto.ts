import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '64b8f0c2e1d2c3a4b5c6d7e',
  })
  userId: string;
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email: string;
  @ApiProperty({
    description: 'Role of the user',
    example: 'admin',
  })
  role: string;
}

export class LoginServiceResponseDto {
  @ApiProperty({
    description: 'The access token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;
  @ApiProperty({
    description: 'The refresh token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refreshToken: string;
  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'The access token for the user',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;
  @ApiProperty({ type: UserDto })
  user: UserDto;
}
