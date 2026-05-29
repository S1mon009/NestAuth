import { ApiProperty } from '@nestjs/swagger';

export class AddUserResponseDto {
  @ApiProperty({
    example: 'User created successfully',
    description:
      'A message indicating the result of the user creation operation.',
  })
  message!: string;
}
