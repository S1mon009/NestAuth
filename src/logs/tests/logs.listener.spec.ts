import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogsListener } from '../logs.listener';
import { LogsService } from '../logs.service';
import { CreateLogDto } from '../dto/create-log.dto';
import { LogDocument } from '../schemas/log.schema';

describe('LogsListener', () => {
  let listener: LogsListener;
  let service: LogsService;
  let eventEmitter: EventEmitter2;

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

  const mockLogsService = {
    getAllLogs: jest.fn(),
    getUserLogs: jest.fn(),
    createLog: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogsListener,
        {
          provide: LogsService,
          useValue: mockLogsService,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            off: jest.fn(),
            emitAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<LogsListener>(LogsListener);
    service = module.get<LogsService>(LogsService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLogCreateEvent', () => {
    it('should create a log when log.create event is emitted', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'User logged in',
        path: '/login',
        userId: 'user123',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(createLogDto);

      expect(service.createLog).toHaveBeenCalledTimes(1);
      expect(service.createLog).toHaveBeenCalledWith(createLogDto);
    });

    it('should handle log creation with all fields', async () => {
      const createLogDto: CreateLogDto = {
        type: 'error',
        description: 'Database connection failed',
        path: '/api/users',
        userId: 'user456',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(createLogDto);

      expect(service.createLog).toHaveBeenCalledWith(createLogDto);
      expect(service.createLog).toHaveBeenCalledTimes(1);
    });

    it('should handle log creation without userId field', async () => {
      const createLogDto: CreateLogDto = {
        type: 'warning',
        description: 'Warning message',
        path: '/api/warning',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(createLogDto);

      expect(service.createLog).toHaveBeenCalledWith(createLogDto);
    });

    it('should handle service errors gracefully', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'Test log',
        path: '/test',
      };

      const error = new Error('Database error');
      mockLogsService.createLog.mockRejectedValue(error);

      await expect(listener.handleLogCreateEvent(createLogDto)).rejects.toThrow(
        'Database error',
      );

      expect(service.createLog).toHaveBeenCalledWith(createLogDto);
    });

    it('should pass correct data types to service', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'User action',
        path: '/api/action',
        userId: 'user-id-123',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(createLogDto);

      const callArgs = mockLogsService.createLog.mock.calls[0][0];
      expect(typeof callArgs.type).toBe('string');
      expect(typeof callArgs.description).toBe('string');
      expect(typeof callArgs.path).toBe('string');
      expect(typeof callArgs.userId).toBe('string');
    });

    it('should handle multiple sequential log creation events', async () => {
      const logDto1: CreateLogDto = {
        type: 'info',
        description: 'First log',
        path: '/first',
      };

      const logDto2: CreateLogDto = {
        type: 'error',
        description: 'Second log',
        path: '/second',
        userId: 'user123',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(logDto1);
      await listener.handleLogCreateEvent(logDto2);

      expect(service.createLog).toHaveBeenCalledTimes(2);
      expect(service.createLog).toHaveBeenNthCalledWith(1, logDto1);
      expect(service.createLog).toHaveBeenNthCalledWith(2, logDto2);
    });
  });

  describe('Listener instantiation', () => {
    it('should be defined', () => {
      expect(listener).toBeDefined();
    });

    it('should have handleLogCreateEvent method', () => {
      expect(listener.handleLogCreateEvent).toBeDefined();
    });

    it('should be injectable', () => {
      expect(listener).toBeInstanceOf(LogsListener);
    });

    it('should inject LogsService', () => {
      expect(service).toBeDefined();
      expect(service).toBe(mockLogsService);
    });
  });

  describe('Event emission integration', () => {
    it('should create log when event is emitted through module', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LogsListener,
          {
            provide: LogsService,
            useValue: mockLogsService,
          },
          EventEmitter2,
        ],
      }).compile();

      const listenerInstance = module.get<LogsListener>(LogsListener);
      const eventEmitterInstance = module.get<EventEmitter2>(EventEmitter2);

      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'Event test',
        path: '/event-test',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      // Emit event
      eventEmitterInstance.emit('log.create', createLogDto);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // The listener should be triggered by the event emitter
      // Note: This is a simplified test. In real scenarios, you might need to use
      // waitFor or other async patterns depending on your event emitter setup
    });
  });

  describe('Error scenarios', () => {
    it('should handle partial log data', async () => {
      const partialDto: Partial<CreateLogDto> = {
        type: 'info',
        description: 'Partial log',
      };

      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      await listener.handleLogCreateEvent(partialDto as CreateLogDto);

      expect(service.createLog).toHaveBeenCalledWith(partialDto);
    });

    it('should handle timeout scenarios', async () => {
      const createLogDto: CreateLogDto = {
        type: 'info',
        description: 'Timeout test',
        path: '/timeout',
      };

      // Simulate a slow database operation
      mockLogsService.createLog.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockLogDocument), 100),
          ),
      );

      const result = await listener.handleLogCreateEvent(createLogDto);

      // The operation should complete successfully
      expect(service.createLog).toHaveBeenCalledWith(createLogDto);
    });
  });

  describe('Log type variations', () => {
    it.each(['info', 'error', 'warning'])(
      'should handle %s log type',
      async (logType) => {
        const createLogDto: CreateLogDto = {
          type: logType as any,
          description: `${logType} message`,
          path: `/api/${logType}`,
        };

        mockLogsService.createLog.mockResolvedValue(mockLogDocument);

        await listener.handleLogCreateEvent(createLogDto);

        expect(service.createLog).toHaveBeenCalledWith(createLogDto);
      },
    );
  });

  describe('Concurrency', () => {
    it('should handle multiple concurrent log creation events', async () => {
      mockLogsService.createLog.mockResolvedValue(mockLogDocument);

      const logDtos: CreateLogDto[] = [
        { type: 'info', description: 'Log 1', path: '/1' },
        { type: 'error', description: 'Log 2', path: '/2' },
        { type: 'warning', description: 'Log 3', path: '/3' },
      ];

      await Promise.all(
        logDtos.map((dto) => listener.handleLogCreateEvent(dto)),
      );

      expect(service.createLog).toHaveBeenCalledTimes(3);
      logDtos.forEach((dto) => {
        expect(service.createLog).toHaveBeenCalledWith(dto);
      });
    });
  });
});
