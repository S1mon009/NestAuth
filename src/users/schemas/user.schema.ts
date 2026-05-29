import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

/**
 * Mongoose schema for the User model, representing users in the database. The schema includes fields for email, password, role, verification status, refresh token, and password reset tokens. It also uses timestamps to automatically track creation and update times for each user entry.
 * @remarks The User schema is designed to store essential information for user authentication and authorization, as well as additional fields to support features like email verification and password reset functionality.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: 'user' })
  role!: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop()
  refreshToken?: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  _id!: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
