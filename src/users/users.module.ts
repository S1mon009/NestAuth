import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { LogsModule } from 'src/logs/logs.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * UsersModule is a NestJS module responsible for handling user-related operations in the application. It imports necessary modules such as AuthModule for authentication and LogsModule for logging user activities. The module defines controllers and providers related to user management, including the UsersController for handling user-related HTTP requests and the UsersService for implementing user management logic. The UsersModule is exported to be used in other parts of the application where user-related functionality is required.
 * The module defines controllers and providers related to user management.
 * The UsersModule is exported to be used in other parts of the application where user-related functionality is required.
 */
@Module({
  imports: [AuthModule, LogsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
