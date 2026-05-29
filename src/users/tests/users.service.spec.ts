// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users.service';
import { AuthService } from 'src/auth/auth.service';
import { User, UserDocument } from '../schemas/user.schema';
import { Profile, ProfileDocument } from '../schemas/profile.schema';
import { Roles } from '../enums/roles.enum';

const mockUser = (
  overrides: Partial<UserDocument> = {},
): Partial<UserDocument> => ({
  _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
  id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: 'hashed-password',
  role: Roles.USER,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const mockProfile = (
  overrides: Partial<ProfileDocument> = {},
): Partial<ProfileDocument> => ({
  _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
  id: '507f1f77bcf86cd799439012',
  userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
  firstName: 'John',
  lastName: 'Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  bio: 'A software developer',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let userModel: jest.Mocked<Model<UserDocument>>;
  let profileModel: jest.Mocked<Model<ProfileDocument>>;
  let authService: jest.Mocked<AuthService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getModelToken(Profile.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('v1') },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
    profileModel = module.get(getModelToken(Profile.name));
    authService = module.get(AuthService);
    eventEmitter = module.get(EventEmitter2);
    configService = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── createUser ────────────────────────────────────────────────────────────

  describe('createUser', () => {
    it('creates a new user successfully with default role', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePass123';
      const adminId = '507f1f77bcf86cd799439013';

      userModel.findOne.mockResolvedValueOnce(null);
      authService.register.mockResolvedValue(undefined);

      const createdUser = mockUser({
        email,
        role: Roles.USER,
        isVerified: false,
      });
      userModel.findOne.mockResolvedValueOnce(createdUser as UserDocument);

      const result = await service.createUser(
        email,
        password,
        Roles.USER,
        adminId,
      );

      expect(userModel.findOne).toHaveBeenCalledWith({ email });
      expect(authService.register).toHaveBeenCalledWith(email, password);
      expect((createdUser as any).save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User created successfully' });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `Admin created user with email ${email} and role ${Roles.USER}`,
          userId: adminId,
        }),
      );
    });

    it('creates a new user with ADMIN role', async () => {
      const email = 'admin@example.com';
      const password = 'SecurePass123';
      const adminId = '507f1f77bcf86cd799439014';

      userModel.findOne.mockResolvedValueOnce(null);
      authService.register.mockResolvedValue(undefined);

      const createdUser = mockUser({ email, role: Roles.ADMIN });
      userModel.findOne.mockResolvedValueOnce(createdUser as UserDocument);

      const result = await service.createUser(
        email,
        password,
        Roles.ADMIN,
        adminId,
      );

      expect(result).toEqual({ message: 'User created successfully' });
      expect((createdUser as any).role).toBe(Roles.ADMIN);
    });

    it('throws BadRequestException when email already exists', async () => {
      const email = 'existing@example.com';
      const existingUser = mockUser({ email });

      userModel.findOne.mockResolvedValue(existingUser as UserDocument);

      await expect(
        service.createUser(
          email,
          'password123',
          Roles.USER,
          '507f1f77bcf86cd799439015',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(authService.register).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user creation fails', async () => {
      const email = 'newuser@example.com';
      const password = 'SecurePass123';

      userModel.findOne.mockResolvedValueOnce(null);
      authService.register.mockResolvedValue(undefined);
      userModel.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createUser(
          email,
          password,
          Roles.USER,
          '507f1f77bcf86cd799439016',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAllUser ────────────────────────────────────────────────────────────

  describe('getAllUser', () => {
    it('retrieves all users successfully', async () => {
      const adminId = '507f1f77bcf86cd799439017';
      const users = [
        mockUser({ email: 'user1@example.com' }),
        mockUser({ email: 'user2@example.com', role: Roles.ADMIN }),
      ];

      const execMock = jest.fn().mockResolvedValue(users);
      const selectMock = jest.fn().mockReturnValue({ exec: execMock });
      const findMock = jest.fn().mockReturnValue({ select: selectMock });
      userModel.find = findMock;

      const result = await service.getAllUser(adminId);

      expect(userModel.find).toHaveBeenCalled();
      expect(selectMock).toHaveBeenCalledWith(
        'email role isVerified createdAt updatedAt',
      );
      expect(result).toEqual(users);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: 'Admin viewed all users',
          userId: adminId,
        }),
      );
    });

    it('returns empty array when no users exist', async () => {
      const adminId = '507f1f77bcf86cd799439018';

      const execMock = jest.fn().mockResolvedValue([]);
      const selectMock = jest.fn().mockReturnValue({ exec: execMock });
      const findMock = jest.fn().mockReturnValue({ select: selectMock });
      userModel.find = findMock;

      const result = await service.getAllUser(adminId);

      expect(result).toEqual([]);
    });
  });

  // ── getOneUserByID ────────────────────────────────────────────────────────

  describe('getOneUserByID', () => {
    it('retrieves a user by ID successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const adminId = '507f1f77bcf86cd799439019';
      const user = mockUser();

      const selectMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
      });
      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
      });

      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user as UserDocument),
      });

      const result = await service.getOneUserByID(userId, adminId);

      expect(userModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
      );
      expect(result).toEqual(user);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `Admin viewed user profile for ${userId}`,
          userId: adminId,
        }),
      );
    });

    it('throws NotFoundException when user not found', async () => {
      const userId = '507f1f77bcf86cd79943901a';

      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getOneUserByID(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('works without adminId parameter', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = mockUser();

      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(user as UserDocument),
      });

      const result = await service.getOneUserByID(userId);

      expect(result).toEqual(user);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `Admin viewed user profile for ${userId}`,
          userId: userId,
        }),
      );
    });
  });

  // ── getUserProfile ────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('retrieves user profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const adminId = '507f1f77bcf86cd79943901b';
      const profile = mockProfile();

      profileModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(profile as ProfileDocument),
      });

      const result = await service.getUserProfile(userId, adminId);

      expect(profileModel.findOne).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
      });
      expect(result).toEqual(profile);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `Admin viewed user profile for ${userId}`,
          userId: adminId,
        }),
      );
    });

    it('throws NotFoundException when profile not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      profileModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getUserProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('works without adminId parameter', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const profile = mockProfile();

      profileModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(profile as ProfileDocument),
      });

      const result = await service.getUserProfile(userId);

      expect(result).toEqual(profile);
    });
  });

  // ── updateUserProfile ─────────────────────────────────────────────────────

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const actionUserId = '507f1f77bcf86cd799439011';
      const profile = mockProfile();
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio',
      };

      profileModel.findOne = jest.fn().mockResolvedValue(profile as any);

      const result = await service.updateUserProfile(
        userId,
        updateData,
        actionUserId,
      );

      expect(profileModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual({ message: 'User updated successfully' });
      expect((profile as any).save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `User profile updated for ${userId}`,
          userId: actionUserId,
        }),
      );
    });

    it('throws NotFoundException when profile not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateData = { firstName: 'Jane' };

      profileModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateUserProfile(userId, updateData),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only provided fields', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const profile = mockProfile();
      const updateData = { firstName: 'Jane' };

      profileModel.findOne = jest.fn().mockResolvedValue(profile as any);

      await service.updateUserProfile(userId, updateData);

      expect((profile as any).save).toHaveBeenCalled();
    });
  });

  // ── updateUserRole ────────────────────────────────────────────────────────

  describe('updateUserRole', () => {
    it('updates user role successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const adminId = '507f1f77bcf86cd79943901c';
      const user = mockUser({ role: Roles.USER });

      userModel.findById = jest.fn().mockResolvedValue(user as UserDocument);

      const result = await service.updateUserRole(userId, Roles.ADMIN, adminId);

      expect(userModel.findById).toHaveBeenCalledWith(
        new Types.ObjectId(userId),
      );
      expect((user as any).role).toBe(Roles.ADMIN);
      expect((user as any).save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User role updated successfully' });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'log.create',
        expect.objectContaining({
          type: 'info',
          description: `Admin updated user role for ${userId} to ${Roles.ADMIN}`,
          userId: adminId,
        }),
      );
    });

    it('throws NotFoundException when user not found', async () => {
      const userId = '507f1f77bcf86cd79943901d';

      userModel.findById = jest.fn().mockResolvedValue(null);

      await expect(
        service.updateUserRole(userId, Roles.ADMIN, '507f1f77bcf86cd79943901e'),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates role from USER to ADMIN', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = mockUser({ role: Roles.USER });

      userModel.findById = jest.fn().mockResolvedValue(user as UserDocument);

      await service.updateUserRole(
        userId,
        Roles.ADMIN,
        '507f1f77bcf86cd79943901f',
      );

      expect((user as any).role).toBe(Roles.ADMIN);
      expect((user as any).save).toHaveBeenCalled();
    });

    it('updates role from ADMIN to USER', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const user = mockUser({ role: Roles.ADMIN });

      userModel.findById = jest.fn().mockResolvedValue(user as UserDocument);

      await service.updateUserRole(
        userId,
        Roles.USER,
        '507f1f77bcf86cd7994390a0',
      );

      expect((user as any).role).toBe(Roles.USER);
      expect((user as any).save).toHaveBeenCalled();
    });
  });
});
