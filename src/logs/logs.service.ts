import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {}

  async createLog(userId: string, action: string, ip?: string) {
    const log = new this.logModel({ userId, action, ip });
    return log.save();
  }

  async getUserLogs(userId: string) {
    return this.logModel.find({ userId }).sort({ createdAt: -1 });
  }
}
