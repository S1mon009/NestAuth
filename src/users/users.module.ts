import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { LogsModule } from 'src/logs/logs.module';
// import { LogsService } from 'src/logs/logs.service';
// import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// import { Profile, ProfileSchema } from './schemas/profile.schema';

@Module({
  imports: [AuthModule, LogsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
