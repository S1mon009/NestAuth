import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogsService } from './logs.service';
import { LogsListener } from './logs.listener';
import { Log, LogSchema } from './schemas/log.schema';
import { LogsController } from './logs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  providers: [LogsService, LogsListener],
  controllers: [LogsController],
  exports: [LogsService, MongooseModule],
})
export class LogsModule {}
