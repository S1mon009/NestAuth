import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
  ) {}

  async findAll(): Promise<LogDocument[]> {
    return this.logModel.find().sort({ createdAt: -1 }).exec();
  }

  async getUserLogs(userId: string): Promise<LogDocument[]> {
    return this.logModel.find({ userId }).sort({ createdAt: -1 });
  }

  async createLog(data: CreateLogDto): Promise<LogDocument> {
    const log = new this.logModel(data);
    return log.save();
  }
}
