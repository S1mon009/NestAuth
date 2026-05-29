import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProfileDocument = Profile & Document;

/**
 * Mongoose schema for the Profile model, representing user profiles in the database. The schema includes fields for user ID, first name, last name, avatar URL, and bio. It also uses timestamps to automatically track creation and update times for each profile entry.
 * @remarks The Profile schema is designed to store additional information about users beyond their basic authentication details, allowing for a richer user experience in the application.
 */
@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true })
  userId!: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
