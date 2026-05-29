import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsService } from './logs.service';
import { LogsListener } from './logs.listener';
import { Log, LogSchema } from './schemas/log.schema';
import { LogsController } from './logs.controller';

/**
 * Module for managing logs in the application, including services, controllers, and database schemas related to logging functionality.
 * @remarks This module integrates with Mongoose for database interactions and includes a listener for handling log-related events. It also provides a controller for exposing log-related endpoints to the API.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  providers: [LogsService, LogsListener],
  controllers: [LogsController],
  exports: [LogsService, MongooseModule],
})
export class LogsModule {}
