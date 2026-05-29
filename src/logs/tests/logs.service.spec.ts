// eslint-disable
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';
import { LogsService } from '../logs.service';
import { Log, LogDocument } from '../schemas/log.schema';
import { CreateLogDto } from '../dto/create-log.dto';

describe('LogsService', () => {
  let service: LogsService;
  let mockLogModel: jest.Mocked<Model<LogDocument>>;

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

  const createMockQuery = (
    resolvedValue?: any,
    rejectedError?: any,
  ): Query<LogDocument[], any> => {
    const mockQuery: any = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    if (rejectedError) {
      mockQuery.exec = jest.fn().mockRejectedValue(rejectedError);
    } else {
      mockQuery.exec = jest.fn().mockResolvedValue(resolvedValue);
    }

    return mockQuery as Query<LogDocument[], any>;
  };

  beforeEach(async () => {
    mockLogModel = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Model<LogDocument>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsService,
        {
          provide: getModelToken(Log.name),
          useValue: mockLogModel,
        },
      ],
    }).compile();

    service = module.get<LogsService>(LogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLogs', () => {
    it('should return all logs sorted by creation date in descending order', async () => {
      const mockQuery = createMockQuery([mockLogDocument, mockLogDocument2]);

      mockLogModel.find.mockReturnValue(mockQuery);

      const result = await service.getAllLogs();

      expect(mockLogModel.find).toHaveBeenCalledWith();
      expect(mockQuery.select).toHaveBeenCalledWith('-__v');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual([mockLogDocument, mockLogDocument2]);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no logs exist', async () => {
      const mockQuery = createMockQuery([]);

      mockLogModel.find.mockReturnValue(mockQuery);

      const result = await service.getAllLogs();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      const mockQuery = createMockQuery(undefined, error);

      mockLogModel.find.mockReturnValue(mockQuery);

      await expect(service.getAllLogs()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('getUserLogs', () => {
    it('should return logs for a specific user sorted by creation date in descending order', async () => {
      const userId = 'user123';
      const mockQuery = createMockQuery([mockLogDocument]);

      mockLogModel.find.mockReturnValue(mockQuery);

      const result = await service.getUserLogs(userId);

      expect(mockLogModel.find).toHaveBeenCalledWith({ userId });
      expect(mockQuery.select).toHaveBeenCalledWith('-__v');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.exec).toHaveBeenCalled();
      expect(result).toEqual([mockLogDocument]);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when user has no logs', async () => {
      const userId = 'nonexistent-user';
      const mockQuery = createMockQuery([]);

      mockLogModel.find.mockReturnValue(mockQuery);

      const result = await service.getUserLogs(userId);

      expect(mockLogModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual([]);
    });

    it('should return multiple logs for a user', async () => {
      const userId = 'user123';
      const userLogs = [mockLogDocument, mockLogDocument];
      const mockQuery = createMockQuery(userLogs);

      mockLogModel.find.mockReturnValue(mockQuery);

      const result = await service.getUserLogs(userId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(userLogs);
    });

    it('should handle database errors during user log retrieval', async () => {
      const userId = 'user123';
      const error = new Error('Database error');
      const mockQuery = createMockQuery(undefined, error);

      mockLogModel.find.mockReturnValue(mockQuery);

      await expect(service.getUserLogs(userId)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createLog', () => {
    it('should create a new log entry', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'User logged in',
        path: '/login',
        userId: 'user123',
      };

      const mockLogInstance = {
        save: jest.fn().mockResolvedValue(mockLogDocument),
      };

      const MockModel = jest.fn(() => mockLogInstance) as any;
      const serviceInstance = new LogsService(MockModel);
      const result = await serviceInstance.createLog(createLogDto);

      expect(MockModel).toHaveBeenCalledWith(createLogDto);
      expect(mockLogInstance.save).toHaveBeenCalled();
      expect(result).toEqual(mockLogDocument);
    });

    it('should handle save errors', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'User action',
        path: '/api/action',
      };

      const error = new Error('Failed to save log');
      const mockLogInstance = {
        save: jest.fn().mockRejectedValue(error),
      };

      const MockModel = jest.fn(() => mockLogInstance) as any;
      const serviceInstance = new LogsService(MockModel);

      await expect(serviceInstance.createLog(createLogDto)).rejects.toThrow(
        'Failed to save log',
      );
    });

    it('should create log with optional userId field', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'User action',
        path: '/api/action',
      };

      const mockLogInstance = {
        save: jest.fn().mockResolvedValue(mockLogDocument),
      };

      const MockModel = jest.fn(() => mockLogInstance) as any;
      const serviceInstance = new LogsService(MockModel);
      const result = await serviceInstance.createLog(createLogDto);

      expect(result).toEqual(mockLogDocument);
    });
  });
});
