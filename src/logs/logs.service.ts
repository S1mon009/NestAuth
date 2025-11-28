import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
  ) {}

  async findAll(): Promise<LogDocument[]> {
    return this.logModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(userId: string, action: string, ip?: string) {
    const log = new this.logModel({ userId, action, ip });
    return log.save();
  }
}
