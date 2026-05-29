import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from '../logs.controller';
import { LogsService } from '../logs.service';
import { LogDocument } from '../schemas/log.schema';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';

describe('LogsController', () => {
  let controller: LogsController;
  let service: LogsService;

  const mockLogDocument: LogDocument = {
    _id: '507f1f77bcf86cd799439011',
    type: 'info',
    description: 'User logged in',
    path: '/login',
    userId: 'user123',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    __v: 0,
  } as unknown as LogDocument;

  const mockLogDocument2: LogDocument = {
    _id: '507f1f77bcf86cd799439012',
    type: 'error',
    description: 'Database connection failed',
    path: '/api/users',
    userId: 'user456',
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z'),
    __v: 0,
  } as unknown as LogDocument;

  const mockLogsService = {
    getAllLogs: jest.fn(),
    getUserLogs: jest.fn(),
    createLog: jest.fn(),
  };

  // Mock interceptor that does nothing
  class MockInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle();
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
      ],
    })
      .overrideInterceptor('CacheInterceptor')
      .useClass(MockInterceptor)
      .compile();

    controller = module.get<LogsController>(LogsController);
    service = module.get<LogsService>(LogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all logs', async () => {
      const expectedLogs = [mockLogDocument, mockLogDocument2];
      mockLogsService.getAllLogs.mockResolvedValue(expectedLogs);

      const result = await controller.findAll();

      expect(service.getAllLogs).toHaveBeenCalledTimes(1);
      expect(service.getAllLogs).toHaveBeenCalledWith();
      expect(result).toEqual(expectedLogs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no logs exist', async () => {
      mockLogsService.getAllLogs.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.getAllLogs).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should handle errors from service', async () => {
      const error = new Error('Database error');
      mockLogsService.getAllLogs.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database error');
    });

    it('should call service with correct parameters', async () => {
      mockLogsService.getAllLogs.mockResolvedValue([mockLogDocument]);

      await controller.findAll();

      expect(mockLogsService.getAllLogs).toHaveBeenCalledWith();
    });

    it('should return logs sorted by creation date', async () => {
      const logsList = [
        {
          ...mockLogDocument2,
          createdAt: new Date('2024-01-02T10:00:00Z'),
        } as LogDocument,
        {
          ...mockLogDocument,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        } as LogDocument,
      ];

      mockLogsService.getAllLogs.mockResolvedValue(logsList);

      const result = await controller.findAll();

      expect(result[0].createdAt.getTime()).toBeGreaterThan(
        result[1].createdAt.getTime(),
      );
    });
  });

  describe('findUserLogs', () => {
    it('should return logs for a specific user', async () => {
      const userId = 'user123';
      const userLogs = [mockLogDocument];
      mockLogsService.getUserLogs.mockResolvedValue(userLogs);

      const result = await controller.findUserLogs(userId);

      expect(service.getUserLogs).toHaveBeenCalledTimes(1);
      expect(service.getUserLogs).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userLogs);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when user has no logs', async () => {
      const userId = 'nonexistent-user';
      mockLogsService.getUserLogs.mockResolvedValue([]);

      const result = await controller.findUserLogs(userId);

      expect(service.getUserLogs).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it('should handle errors when retrieving user logs', async () => {
      const userId = 'user123';
      const error = new Error('User not found');
      mockLogsService.getUserLogs.mockRejectedValue(error);

      await expect(controller.findUserLogs(userId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should pass user ID correctly to service', async () => {
      const userId = 'specific-user-id-123';
      mockLogsService.getUserLogs.mockResolvedValue([mockLogDocument]);

      await controller.findUserLogs(userId);

      expect(mockLogsService.getUserLogs).toHaveBeenCalledWith(userId);
    });

    it('should return multiple logs for a user', async () => {
      const userId = 'user123';
      const userLogs = [mockLogDocument, mockLogDocument2];
      mockLogsService.getUserLogs.mockResolvedValue(userLogs);

      const result = await controller.findUserLogs(userId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(userLogs);
    });

    it('should handle special characters in user ID', async () => {
      const userId = 'user-123_456.789';
      mockLogsService.getUserLogs.mockResolvedValue([mockLogDocument]);

      const result = await controller.findUserLogs(userId);

      expect(service.getUserLogs).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(1);
    });
  });

  describe('Controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have findAll method', () => {
      expect(controller.findAll).toBeDefined();
    });

    it('should have findUserLogs method', () => {
      expect(controller.findUserLogs).toBeDefined();
    });

    it('should inject LogsService', () => {
      expect(service).toBeDefined();
      expect(service).toBe(mockLogsService);
    });
  });

  describe('Error handling', () => {
    it('should handle null response from service', async () => {
      mockLogsService.getAllLogs.mockResolvedValue(null);

      const result = await controller.findAll();

      expect(result).toBeNull();
    });

    it('should handle undefined response from service', async () => {
      mockLogsService.getAllLogs.mockResolvedValue(undefined);

      const result = await controller.findAll();

      expect(result).toBeUndefined();
    });

    it('should propagate service errors without modification', async () => {
      const customError = new Error('Custom service error');
      mockLogsService.getUserLogs.mockRejectedValue(customError);

      await expect(controller.findUserLogs('user1')).rejects.toThrow(
        customError,
      );
    });
  });
});
