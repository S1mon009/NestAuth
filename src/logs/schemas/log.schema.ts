import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { type LogType } from '../types/log-type.type';

export type LogDocument = Log & Document;

/**
 * Mongoose schema for the Log model, representing log entries in the database.
 * @remarks The schema includes fields for the log type, description, path, and an optional user ID. It also uses timestamps to automatically track creation and update times for each log entry.
 */
@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true, type: String })
  type!: LogType;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  path!: string;

  @Prop()
  userId?: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
