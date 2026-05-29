import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserResponseDto {
  @ApiProperty({
    example: 'User updated successfully',
    description:
      'A message indicating the result of the user update operation.',
  })
  message!: string;
}
