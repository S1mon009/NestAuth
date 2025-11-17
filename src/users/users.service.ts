import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(Profile.name) private profileModel: Model<ProfileDocument>) {}

  async createProfile(userId: string, data: Partial<Profile>) {
    const profile = new this.profileModel({ userId, ...data });
    return profile.save();
  }

  async getProfile(userId: string) {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: Partial<Profile>) {
    const profile = await this.profileModel.findOneAndUpdate({ userId }, data, { new: true });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }
}
