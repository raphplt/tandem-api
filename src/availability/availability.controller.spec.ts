import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { AvailabilityStatus } from './entities/availability.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OwnershipGuard } from '../auth/ownership.guard';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let availabilityService: DeepMockProxy<AvailabilityService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: mockDeep<AvailabilityService>(),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OwnershipGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    availabilityService = module.get(AvailabilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new availability record', async () => {
      const createDto: CreateAvailabilityDto = {
        userId: 'user-1',
        date: '2024-01-01',
        status: AvailabilityStatus.IDLE,
        isAvailable: false,
      };

      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.IDLE,
        date: new Date('2024-01-01'),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: false,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(availabilityService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    it('should return all availability records', async () => {
      const mockResponse: AvailabilityResponseDto[] = [
        { id: 'availability-1', userId: 'user-1' } as AvailabilityResponseDto,
        { id: 'availability-2', userId: 'user-2' } as AvailabilityResponseDto,
      ];

      availabilityService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(availabilityService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyAvailability', () => {
    it('should return current user availability', async () => {
      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.QUEUED,
        date: new Date(),
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 10,
        timeSinceLastHeartbeat: 1,
        canBeMatched: true,
        isExpired: false,
        sessionDuration: 30,
      };

      availabilityService.getCurrentAvailability.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.getMyAvailability(mockUser);

      expect(availabilityService.getCurrentAvailability).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByUserId', () => {
    it('should return availability records for a specific user', async () => {
      const mockResponse: AvailabilityResponseDto[] = [
        { id: 'availability-1', userId: 'user-1' } as AvailabilityResponseDto,
      ];

      availabilityService.findByUserId.mockResolvedValue(mockResponse);

      const result = await controller.findByUserId('user-1');

      expect(availabilityService.findByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByDate', () => {
    it('should return availability records for a specific date', async () => {
      const mockResponse: AvailabilityResponseDto[] = [
        {
          id: 'availability-1',
          date: new Date('2024-01-01'),
        } as AvailabilityResponseDto,
      ];

      availabilityService.findByDate.mockResolvedValue(mockResponse);

      const result = await controller.findByDate('2024-01-01');

      expect(availabilityService.findByDate).toHaveBeenCalledWith('2024-01-01');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getQueuedUsers', () => {
    it('should return users currently in the matching queue', async () => {
      const mockResponse: AvailabilityResponseDto[] = [
        {
          id: 'availability-1',
          status: AvailabilityStatus.QUEUED,
        } as AvailabilityResponseDto,
      ];

      availabilityService.getQueuedUsers.mockResolvedValue(mockResponse);

      const result = await controller.getQueuedUsers(10);

      expect(availabilityService.getQueuedUsers).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOnlineUsers', () => {
    it('should return currently online users', async () => {
      const mockResponse: AvailabilityResponseDto[] = [
        { id: 'availability-1', isOnline: true } as AvailabilityResponseDto,
      ];

      availabilityService.getOnlineUsers.mockResolvedValue(mockResponse);

      const result = await controller.getOnlineUsers(20);

      expect(availabilityService.getOnlineUsers).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockStats = {
        totalQueued: 5,
        onlineQueued: 3,
        averageWaitTime: 15,
        oldestInQueue: 30,
      };

      availabilityService.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(availabilityService.getQueueStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findOne', () => {
    it('should return a specific availability record', async () => {
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.IDLE,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: false,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne('availability-1');

      expect(availabilityService.findOne).toHaveBeenCalledWith(
        'availability-1',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update an availability record', async () => {
      const updateDto: UpdateAvailabilityDto = {
        status: AvailabilityStatus.QUEUED,
        isAvailable: true,
      };

      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.QUEUED,
        date: new Date(),
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: true,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.update.mockResolvedValue(mockResponse);

      const result = await controller.update(
        'availability-1',
        updateDto,
        mockUser,
      );

      expect(availabilityService.update).toHaveBeenCalledWith(
        'availability-1',
        updateDto,
        'user-1',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendHeartbeat', () => {
    it('should send heartbeat to maintain online status', async () => {
      const mockUser = { id: 'user-1' };
      const metadata = { deviceInfo: { platform: 'mobile' } };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.IDLE,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.sendHeartbeat.mockResolvedValue(mockResponse);

      const result = await controller.sendHeartbeat(mockUser, metadata);

      expect(availabilityService.sendHeartbeat).toHaveBeenCalledWith(
        'user-1',
        metadata,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('joinQueue', () => {
    it('should join the matching queue', async () => {
      const mockUser = { id: 'user-1' };
      const preferences = { maxWaitTime: 30 };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.QUEUED,
        date: new Date(),
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: true,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.joinQueue.mockResolvedValue(mockResponse);

      const result = await controller.joinQueue(mockUser, preferences);

      expect(availabilityService.joinQueue).toHaveBeenCalledWith(
        'user-1',
        preferences,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('leaveQueue', () => {
    it('should leave the matching queue', async () => {
      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.IDLE,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.leaveQueue.mockResolvedValue(mockResponse);

      const result = await controller.leaveQueue(mockUser);

      expect(availabilityService.leaveQueue).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsMatched', () => {
    it('should mark user as matched', async () => {
      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.MATCHED,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.markAsMatched.mockResolvedValue(mockResponse);

      const result = await controller.markAsMatched(mockUser);

      expect(availabilityService.markAsMatched).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsBusy', () => {
    it('should mark user as busy', async () => {
      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.BUSY,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: true,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.markAsBusy.mockResolvedValue(mockResponse);

      const result = await controller.markAsBusy(mockUser);

      expect(availabilityService.markAsBusy).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsOffline', () => {
    it('should mark user as offline', async () => {
      const mockUser = { id: 'user-1' };
      const mockResponse: AvailabilityResponseDto = {
        id: 'availability-1',
        userId: 'user-1',
        status: AvailabilityStatus.OFFLINE,
        date: new Date(),
        isActive: true,
        isAvailable: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isOnline: false,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      };

      availabilityService.markAsOffline.mockResolvedValue(mockResponse);

      const result = await controller.markAsOffline(mockUser);

      expect(availabilityService.markAsOffline).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('cleanupExpiredAvailabilities', () => {
    it('should clean up expired availability records', async () => {
      const mockResult = { deleted: 5 };

      availabilityService.cleanupExpiredAvailabilities.mockResolvedValue(5);

      const result = await controller.cleanupExpiredAvailabilities();

      expect(
        availabilityService.cleanupExpiredAvailabilities,
      ).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('cleanupOfflineUsers', () => {
    it("should mark offline users who haven't sent heartbeat", async () => {
      const mockResult = { updated: 3 };

      availabilityService.cleanupOfflineUsers.mockResolvedValue(3);

      const result = await controller.cleanupOfflineUsers();

      expect(availabilityService.cleanupOfflineUsers).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });

  describe('remove', () => {
    it('should soft delete an availability record', async () => {
      const mockUser = { id: 'user-1' };

      availabilityService.remove.mockResolvedValue(undefined);

      await controller.remove('availability-1', mockUser);

      expect(availabilityService.remove).toHaveBeenCalledWith(
        'availability-1',
        'user-1',
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete an availability record', async () => {
      availabilityService.hardDelete.mockResolvedValue(undefined);

      await controller.hardDelete('availability-1');

      expect(availabilityService.hardDelete).toHaveBeenCalledWith(
        'availability-1',
      );
    });
  });
});
