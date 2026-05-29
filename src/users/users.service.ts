import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { AuthService } from 'src/auth/auth.service';
import {
  AddUserResponseDto,
  UpdateUserResponseDto,
  UpdateUserRoleResponseDto,
} from './dto';
import { Roles } from './enums/roles.enum';

/**
 * UsersService handles all user-related operations such as creating users, retrieving user information, and updating user profiles and roles. It interacts with the User and Profile Mongoose models to perform database operations. The service also emits events for logging purposes whenever a user is created, viewed, or updated. It uses the AuthService to handle user registration and authentication-related tasks.
 * Key functionalities:
 * - createUser: Registers a new user and assigns a role.
 * - getAllUser: Retrieves a list of all users.
 * - getOneUserByID: Retrieves a specific user by their ID.
 * - getUserProfile: Retrieves the profile information of a specific user.
 * - updateUserProfile: Updates the profile information of a specific user.
 * - updateUserRole: Updates the role of a specific user.
 * The service also handles error cases such as duplicate email registration, user not found, and profile not found, throwing appropriate exceptions.
 */
@Injectable()
export class UsersService {
  /**
   * Constructor for UsersService, injecting necessary dependencies including Mongoose models for User and Profile, Config service for accessing configuration values, Auth service for handling user registration and authentication-related tasks, and Event emitter for logging events.
   * @param {Model<UserDocument>} userModel Mongoose model representing the user entity.
   * @param {Model<ProfileDocument>} profileModel Mongoose model representing the user profile entity.
   * @param {ConfigService} configService Service for accessing application configuration values.
   * @param {AuthService} authService Service responsible for handling user registration and authentication-related tasks.
   * @param {EventEmitter2} eventEmitter Event emitter for logging events related to user operations such as creation, viewing, and updates.
   */
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a new user with the specified email, password, role, and admin ID.
   * @param {string} email The user's email address.
   * @param {string} password The user's password.
   * @param {Roles} role The role to assign to the user.
   * @param {string} adminId The ID of the admin creating the user.
   * @returns {Promise<AddUserResponseDto>} A promise that resolves to an AddUserResponseDto indicating the success of the operation.
   */
  async createUser(
    email: string,
    password: string,
    role: Roles = Roles.USER,
    adminId: string,
  ): Promise<AddUserResponseDto> {
    const existing: UserDocument | null = await this.userModel.findOne({
      email,
    });
    if (existing) throw new BadRequestException('Email already exists');

    await this.authService.register(email, password);

    const user: UserDocument | null = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User creation failed');

    user.role = role;
    await user.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Admin created user with email ${email} and role ${role}`,
      path: `${this.configService.get<string>('API_VERSION')}/users/add`,
      userId: adminId,
    });

    return { message: 'User created successfully' };
  }

  /**
   * Retrieves a list of all users.
   * @param {string} adminId The ID of the admin viewing the users.
   * @returns {Promise<UserDocument[]>} A promise that resolves to an array of UserDocument objects.
   */
  async getAllUser(adminId: string): Promise<UserDocument[]> {
    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Admin viewed all users`,
      path: `${this.configService.get<string>('API_VERSION')}/users/all`,
      userId: adminId,
    });

    return this.userModel
      .find()
      .select('email role isVerified createdAt updatedAt')
      .exec();
  }

  /**
   * Retrieves a specific user by their ID.
   * @param {string} userId The ID of the user to retrieve.
   * @param {string} adminId The ID of the admin viewing the user.
   * @returns {Promise<UserDocument>} A promise that resolves to the UserDocument object.
   */
  async getOneUserByID(
    userId: string,
    adminId?: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .select('email role isVerified createdAt updatedAt');

    if (!user) throw new NotFoundException('User not found');

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Admin viewed user profile for ${userId}`,
      path: `${this.configService.get<string>('API_VERSION')}/users/${userId}`,
      userId: adminId || userId,
    });

    return user;
  }

  /**
   * Retrieves the profile information of a specific user.
   * @param {string} userId The ID of the user whose profile to retrieve.
   * @param {string} adminId The ID of the admin viewing the profile.
   * @returns {Promise<ProfileDocument>} A promise that resolves to the ProfileDocument object.
   */
  async getUserProfile(
    userId: string,
    adminId?: string,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel
      .findOne({
        userId: new Types.ObjectId(userId),
      })
      .select('-__v');

    if (!profile) throw new NotFoundException('Profile not found');

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Admin viewed user profile for ${userId}`,
      path: `${this.configService.get<string>('API_VERSION')}/users/profile/${userId}`,
      userId: adminId || userId,
    });

    return profile;
  }

  /**
   * Updates the profile information of a specific user.
   * @param {string} userId The ID of the user whose profile to update.
   * @param {Partial<Profile>} updateData The data to update in the user's profile.
   * @param {string} actionUserId The ID of the user performing the update.
   * @returns {Promise<UpdateUserResponseDto>} A promise that resolves to an UpdateUserResponseDto indicating the success of the operation.
   */
  async updateUserProfile(
    userId: string,
    updateData: Partial<Profile>,
    actionUserId?: string,
  ): Promise<UpdateUserResponseDto> {
    const profile = await this.profileModel.findOne({ userId });
    if (!profile) throw new NotFoundException('Profile not found');

    Object.assign(profile, updateData);
    await profile.save();

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `User profile updated for ${userId}`,
      path: `${this.configService.get<string>('API_VERSION')}/users/${userId}`,
      userId: actionUserId,
    });

    return { message: 'User updated successfully' };
  }

  /**
   * Updates the role of a specific user.
   * @param {string} userId The ID of the user whose role to update.
   * @param {Roles} newRole The new role to assign to the user.
   * @param {string} adminId The ID of the admin performing the update.
   * @returns {Promise<UpdateUserRoleResponseDto>} A promise that resolves to an UpdateUserRoleResponseDto indicating the success of the operation.
   */
  async updateUserRole(
    userId: string,
    newRole: Roles,
    adminId: string,
  ): Promise<UpdateUserRoleResponseDto> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');

    user.role = newRole;

    this.eventEmitter.emit('log.create', {
      type: 'info',
      description: `Admin updated user role for ${userId} to ${newRole}`,
      path: `${this.configService.get<string>('API_VERSION')}/users/${userId}/role`,
      userId: adminId,
    });

    await user.save();

    return { message: 'User role updated successfully' };
  }
}
