import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createUserAdmin(
    email: string,
    password: string,
    role: Roles = Roles.USER,
    adminId: string,
  ): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new BadRequestException('Email already exists');

    await this.authService.register(email, password);

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User creation failed');

    user.role = role;
    await user.save();

    this.eventEmitter.emit('log.create', {
      userId: adminId,
      action: 'USER_CREATED_BY_ADMIN',
    });

    return user;
  }

  async findAll(adminId: string): Promise<UserDocument[]> {
    this.eventEmitter.emit('log.create', {
      userId: adminId,
      action: 'ALL_USERS_VIEWED',
    });

    return this.userModel.find().exec();
  }

  async findOneById(userId: string, adminId?: string): Promise<UserDocument> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');

    this.eventEmitter.emit('log.create', {
      userId: adminId || userId,
      action: `USER_PROFILE_VIEWED ${userId} ${adminId ? '(by admin)' : ''}`,
    });

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

    this.eventEmitter.emit('log.create', {
      userId: actionUserId,
      action: `USER_PROFILE_UPDATED ${userId}`,
    });

    return profile;
  }

  async getUserProfile(
    userId: string,
    adminId?: string,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!profile) throw new NotFoundException('Profile not found');

    this.eventEmitter.emit('log.create', {
      userId: adminId || userId,
      action: `USER_PROFILE_VIEWED ${userId} ${adminId ? '(by admin)' : ''}`,
    });
    return profile;
  }

  async updateUserRole(
    userId: string,
    newRole: Roles,
    adminId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');

    user.role = newRole;

    this.eventEmitter.emit('log.create', {
      userId: adminId,
      action: `USER_ROLE_UPDATED ${userId} TO ${newRole}`,
    });
    return user.save();
  }
}
