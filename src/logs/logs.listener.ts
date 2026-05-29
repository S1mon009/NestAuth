import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LogsService } from './logs.service';
import { type CreateLogDto } from './dto/create-log.dto';

/**
 * Listener for handling log-related events, specifically for creating new log entries when a 'log.create' event is emitted.
 * @remarks This listener listens for 'log.create' events and uses the LogsService to create new log entries in the database based on the provided payload. It helps decouple the log creation logic from other parts of the application, allowing for better separation of concerns and easier maintenance.
 */
@Injectable()
export class LogsListener {
  /**
   * Creates an instance of the LogsListener.
   * @param {LogsService} logsService The logs service that contains the business logic for handling log-related operations, including creating new log entries in the database.
   */
  constructor(private readonly logsService: LogsService) {}

  /**
   * Handles the 'log.create' event by creating a new log entry.
   * @param {CreateLogDto} payload The data for the new log entry.
   */
  @OnEvent('log.create')
  async handleLogCreateEvent(payload: CreateLogDto) {
    await this.logsService.createLog(payload);
  }
}
