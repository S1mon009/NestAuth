import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LogsService } from './logs.service';

@Injectable()
export class LogsListener {
  constructor(private readonly logsService: LogsService) {}

  @OnEvent('log.create')
  async handleLogCreateEvent(payload: {
    userId: string;
    action: string;
    ip?: string;
  }) {
    await this.logsService.createLog(payload);
  }
}
