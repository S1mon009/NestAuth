import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';
import { CreateLogDto } from './dto/create-log.dto';

/**
 * LogsService handles the creation and retrieval of log entries in the application. It interacts with the MongoDB database using Mongoose models to perform CRUD operations on log documents.
 * Key functionalities:
 * - getAll: Retrieves all logs sorted by creation date in descending order.
 * - getUserLogs: Retrieves logs for a specific user sorted by creation date in descending order.
 * - createLog: Creates a new log entry.
 */
@Injectable()
export class LogsService {
  /**
   * Initializes the LogsService with the Mongoose model for logs.
   * @param {Model<LogDocument>} logModel The Mongoose model for log documents, injected using the @InjectModel decorator.
   */
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
  ) {}

  /**
   * Retrieve all logs sorted by creation date in descending order.
   * @returns {Promise<LogDocument[]>} A promise that resolves to an array of log documents.
   */
  async getAllLogs(): Promise<LogDocument[]> {
    const query: Query<LogDocument[], any> = this.logModel
      .find()
      .select('-__v')
      .sort({ createdAt: -1 });
    return query.exec();
  }

  /**
   * Retrieve logs for a specific user sorted by creation date in descending order.
   * @param {string} userId The ID of the user whose logs to retrieve.
   * @returns {Promise<LogDocument[]>} A promise that resolves to an array of log documents.
   */
  async getUserLogs(userId: string): Promise<LogDocument[]> {
    const query: Query<LogDocument[], any> = this.logModel
      .find({ userId })
      .select('-__v')
      .sort({ createdAt: -1 });
    return query.exec();
  }

  /**
   * Create a new log entry.
   * @param {CreateLogDto} data The data for the new log entry.
   * @returns {Promise<LogDocument>} A promise that resolves to the created log document.
   */
  async createLog(data: CreateLogDto): Promise<LogDocument> {
    const log: LogDocument = new this.logModel(data);
    return log.save();
  }
}
