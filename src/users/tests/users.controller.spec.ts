// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { Roles } from '../enums/roles.enum';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { AddUserDto, UpdateUserDto, UpdateUserRoleDto } from '../dto';

const mockUser = (overrides: any = {}) => ({
  userId: 'user-id-123',
  role: Roles.USER,
  ...overrides,
});

const mockRequest = (userOverrides: any = {}): Partial<RequestWithUser> => ({
  user: mockUser(userOverrides),
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            createUser: jest.fn(),
            getAllUser: jest.fn(),
            getOneUserByID: jest.fn(),
            getUserProfile: jest.fn(),
            updateUserProfile: jest.fn(),
            updateUserRole: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a new user successfully', async () => {
      const dto: AddUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        role: Roles.USER,
      };
      const req = mockRequest({ role: Roles.ADMIN, userId: 'admin-id-123' });
      const expected = { message: 'User created successfully' };

      usersService.createUser.mockResolvedValue(expected);

      const result = await controller.create(dto, req as RequestWithUser);

      expect(usersService.createUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        Roles.USER,
        'admin-id-123',
      );
      expect(result).toEqual(expected);
    });

    it('uses default USER role when role not provided', async () => {
      const dto: AddUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
      };
      const req = mockRequest({ role: Roles.ADMIN });

      usersService.createUser.mockResolvedValue({
        message: 'User created successfully',
      });

      await controller.create(dto, req as RequestWithUser);

      expect(usersService.createUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        Roles.USER,
        expect.any(String),
      );
    });

    it('creates user with ADMIN role when specified', async () => {
      const dto: AddUserDto = {
        email: 'admin@example.com',
        password: 'SecurePass123',
        role: Roles.ADMIN,
      };
      const req = mockRequest({ role: Roles.ADMIN });

      usersService.createUser.mockResolvedValue({
        message: 'User created successfully',
      });

      await controller.create(dto, req as RequestWithUser);

      expect(usersService.createUser).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        Roles.ADMIN,
        expect.any(String),
      );
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retrieves all users successfully', async () => {
      const req = mockRequest({ role: Roles.ADMIN });
      const users = [
        {
          _id: 'user-1',
          email: 'user1@example.com',
          role: Roles.USER,
        },
        {
          _id: 'user-2',
          email: 'admin@example.com',
          role: Roles.ADMIN,
        },
      ];

      usersService.getAllUser.mockResolvedValue(users as any);

      const result = await controller.findAll(req as RequestWithUser);

      expect(usersService.getAllUser).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(users);
    });

    it('returns empty array when no users exist', async () => {
      const req = mockRequest({ role: Roles.ADMIN });

      usersService.getAllUser.mockResolvedValue([]);

      const result = await controller.findAll(req as RequestWithUser);

      expect(result).toEqual([]);
    });
  });

  // ── getMe ─────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('retrieves current user profile successfully', async () => {
      const userId = 'user-id-123';
      const req = mockRequest({ userId });
      const user = {
        _id: userId,
        email: 'test@example.com',
        role: Roles.USER,
      };

      usersService.getOneUserByID.mockResolvedValue(user as any);

      const result = await controller.getMe(req as RequestWithUser);

      expect(usersService.getOneUserByID).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('calls service with correct userId from request', async () => {
      const userId = 'specific-user-id';
      const req = mockRequest({ userId });

      usersService.getOneUserByID.mockResolvedValue({} as any);

      await controller.getMe(req as RequestWithUser);

      expect(usersService.getOneUserByID).toHaveBeenCalledWith(userId);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retrieves a user by ID successfully', async () => {
      const userId = 'user-id-456';
      const adminId = 'admin-id-123';
      const req = mockRequest({ role: Roles.ADMIN, userId: adminId });
      const user = {
        _id: userId,
        email: 'user@example.com',
        role: Roles.USER,
      };

      usersService.getOneUserByID.mockResolvedValue(user as any);

      const result = await controller.findOne(userId, req as RequestWithUser);

      expect(usersService.getOneUserByID).toHaveBeenCalledWith(userId, adminId);
      expect(result).toEqual(user);
    });

    it('retrieves user with different IDs', async () => {
      const userId = 'user-id-789';
      const req = mockRequest({ role: Roles.ADMIN });

      usersService.getOneUserByID.mockResolvedValue({} as any);

      await controller.findOne(userId, req as RequestWithUser);

      expect(usersService.getOneUserByID).toHaveBeenCalledWith(
        userId,
        expect.any(String),
      );
    });
  });

  // ── getUserProfile ────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('allows user to view their own profile', async () => {
      const userId = 'user-id-123';
      const req = mockRequest({ userId, role: Roles.USER });
      const profile = {
        _id: 'profile-id',
        userId,
        firstName: 'John',
        lastName: 'Doe',
      };

      usersService.getUserProfile.mockResolvedValue(profile as any);

      const result = await controller.getUserProfile(
        userId,
        req as RequestWithUser,
      );

      expect(usersService.getUserProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(profile);
    });

    it('allows admin to view any user profile', async () => {
      const userId = 'user-id-456';
      const adminId = 'admin-id-123';
      const req = mockRequest({ userId: adminId, role: Roles.ADMIN });
      const profile = {
        _id: 'profile-id',
        userId,
        firstName: 'Jane',
        lastName: 'Smith',
      };

      usersService.getUserProfile.mockResolvedValue(profile as any);

      const result = await controller.getUserProfile(
        userId,
        req as RequestWithUser,
      );

      expect(usersService.getUserProfile).toHaveBeenCalledWith(userId, adminId);
      expect(result).toEqual(profile);
    });

    it('throws ForbiddenException when non-admin user tries to view others profile', async () => {
      const userId = 'user-id-456';
      const currentUserId = 'user-id-123';
      const req = mockRequest({ userId: currentUserId, role: Roles.USER });

      await expect(
        controller.getUserProfile(userId, req as RequestWithUser),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.getUserProfile).not.toHaveBeenCalled();
    });

    it('throws error with correct message for forbidden profile access', async () => {
      const userId = 'user-id-789';
      const currentUserId = 'user-id-123';
      const req = mockRequest({ userId: currentUserId, role: Roles.USER });

      try {
        await controller.getUserProfile(userId, req as RequestWithUser);
        fail('Should have thrown ForbiddenException');
      } catch (error: any) {
        expect(error.message).toBe('You cannot view this profile');
      }
    });
  });

  // ── updateUserProfile ─────────────────────────────────────────────────────

  describe('updateUserProfile', () => {
    it('allows user to update their own profile', async () => {
      const userId = 'user-id-123';
      const req = mockRequest({ userId, role: Roles.USER });
      const dto: Partial<UpdateUserDto> = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const expected = { message: 'User updated successfully' };

      usersService.updateUserProfile.mockResolvedValue(expected);

      const result = await controller.updateUserProfile(
        userId,
        dto,
        req as RequestWithUser,
      );

      expect(usersService.updateUserProfile).toHaveBeenCalledWith(
        userId,
        dto,
        userId,
      );
      expect(result).toEqual(expected);
    });

    it('allows admin to update any user profile', async () => {
      const userId = 'user-id-456';
      const adminId = 'admin-id-123';
      const req = mockRequest({ userId: adminId, role: Roles.ADMIN });
      const dto: Partial<UpdateUserDto> = {
        firstName: 'Updated',
        bio: 'New bio',
      };
      const expected = { message: 'User updated successfully' };

      usersService.updateUserProfile.mockResolvedValue(expected);

      const result = await controller.updateUserProfile(
        userId,
        dto,
        req as RequestWithUser,
      );

      expect(usersService.updateUserProfile).toHaveBeenCalledWith(
        userId,
        dto,
        adminId,
      );
      expect(result).toEqual(expected);
    });

    it('throws ForbiddenException when non-admin user tries to update others profile', async () => {
      const userId = 'user-id-456';
      const currentUserId = 'user-id-123';
      const req = mockRequest({ userId: currentUserId, role: Roles.USER });
      const dto: Partial<UpdateUserDto> = { firstName: 'Hacker' };

      await expect(
        controller.updateUserProfile(userId, dto, req as RequestWithUser),
      ).rejects.toThrow(ForbiddenException);

      expect(usersService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('throws error with correct message for forbidden update', async () => {
      const userId = 'user-id-456';
      const currentUserId = 'user-id-123';
      const req = mockRequest({ userId: currentUserId, role: Roles.USER });

      try {
        await controller.updateUserProfile(
          userId,
          { firstName: 'Hacker' },
          req as RequestWithUser,
        );
        fail('Should have thrown ForbiddenException');
      } catch (error: any) {
        expect(error.message).toBe('You cannot update this user');
      }
    });

    it('updates all allowed fields', async () => {
      const userId = 'user-id-123';
      const req = mockRequest({ userId, role: Roles.USER });
      const dto: Partial<UpdateUserDto> = {
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Developer',
      };

      usersService.updateUserProfile.mockResolvedValue({
        message: 'User updated successfully',
      });

      await controller.updateUserProfile(userId, dto, req as RequestWithUser);

      expect(usersService.updateUserProfile).toHaveBeenCalledWith(
        userId,
        dto,
        userId,
      );
    });
  });

  // ── updateUserRole ────────────────────────────────────────────────────────

  describe('updateUserRole', () => {
    it('updates user role from USER to ADMIN', async () => {
      const userId = 'user-id-123';
      const adminId = 'admin-id-456';
      const req = mockRequest({ userId: adminId, role: Roles.ADMIN });
      const dto: UpdateUserRoleDto = { role: Roles.ADMIN };
      const expected = { message: 'User role updated successfully' };

      usersService.updateUserRole.mockResolvedValue(expected);

      const result = await controller.updateUserRole(
        userId,
        dto,
        req as RequestWithUser,
      );

      expect(usersService.updateUserRole).toHaveBeenCalledWith(
        userId,
        Roles.ADMIN,
        adminId,
      );
      expect(result).toEqual(expected);
    });

    it('updates user role from ADMIN to USER', async () => {
      const userId = 'admin-user-id';
      const adminId = 'admin-id-123';
      const req = mockRequest({ userId: adminId, role: Roles.ADMIN });
      const dto: UpdateUserRoleDto = { role: Roles.USER };
      const expected = { message: 'User role updated successfully' };

      usersService.updateUserRole.mockResolvedValue(expected);

      const result = await controller.updateUserRole(
        userId,
        dto,
        req as RequestWithUser,
      );

      expect(usersService.updateUserRole).toHaveBeenCalledWith(
        userId,
        Roles.USER,
        adminId,
      );
      expect(result).toEqual(expected);
    });

    it('passes role from DTO to service', async () => {
      const userId = 'user-id-123';
      const req = mockRequest({ role: Roles.ADMIN });
      const dto: UpdateUserRoleDto = { role: Roles.ADMIN };

      usersService.updateUserRole.mockResolvedValue({
        message: 'User role updated successfully',
      });

      await controller.updateUserRole(userId, dto, req as RequestWithUser);

      expect(usersService.updateUserRole).toHaveBeenCalledWith(
        userId,
        dto.role,
        expect.any(String),
      );
    });
  });
});
