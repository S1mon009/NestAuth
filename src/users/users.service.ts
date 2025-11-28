import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { Log, LogDocument } from '../logs/schemas/log.schema';
import { AuthService } from 'src/auth/auth.service';
import { Roles } from './enums/roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(Log.name)
    private readonly logModel: Model<LogDocument>,

    private readonly authService: AuthService,
  ) {}

  async createUserAdmin(
    email: string,
    password: string,
    role: Roles = Roles.USER,
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new BadRequestException('Email already exists');

    await this.authService.register(email, password);

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User creation failed');

    user.role = role;
    await user.save();

    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOneById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(new Types.ObjectId(id));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(
    userId: string,
    updateData: Partial<Profile>,
    actionUserId?: string,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) throw new NotFoundException('Profile not found');

    Object.assign(profile, updateData);
    await profile.save();

    await this.logAction(actionUserId || userId, 'update_profile');

    return profile;
  }

  async getUserProfile(userId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateUserRole(userId: string, newRole: Roles): Promise<UserDocument> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');

    user.role = newRole;
    return user.save();
  }

  async logAction(userId: string, action: string, ip?: string) {
    const log = new this.logModel({ userId, action, ip });
    await log.save();
  }
}
