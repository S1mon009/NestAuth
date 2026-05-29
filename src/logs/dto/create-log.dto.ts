import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import LogTypes, { type LogType } from '../types/log-type.type';

export class CreateLogDto {
  @ApiProperty({
    enum: LogTypes,
    description: 'The type of the log entry',
    example: 'info',
  })
  @IsString()
  @IsNotEmpty()
  type!: LogType;

  @ApiProperty({
    description: 'The description of the log entry',
    example: 'User logged in',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'The path of the log entry',
    example: '/login',
  })
  @IsString()
  @IsNotEmpty()
  path!: string;

  @ApiProperty({
    description: 'The ID of the user associated with the log entry',
    example: 'user123',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  userId?: string;
}
