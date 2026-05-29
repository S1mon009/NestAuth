import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleResponseDto {
  @ApiProperty({
    example: 'User role updated successfully',
    description:
      'A message indicating the result of the user role update operation.',
  })
  message!: string;
}
