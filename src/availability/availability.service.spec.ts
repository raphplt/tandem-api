import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Availability,
  AvailabilityStatus,
} from './entities/availability.entity';
import { User } from '../users/entities/user.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepository: DeepMockProxy<Repository<Availability>>;
  let userRepository: DeepMockProxy<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(Availability),
          useValue: mockDeep<Repository<Availability>>(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockDeep<Repository<User>>(),
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    availabilityRepository = module.get(getRepositoryToken(Availability));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new availability record', async () => {
      const createDto: CreateAvailabilityDto = {
        userId: 'user-1',
        date: '2024-01-01',
        status: AvailabilityStatus.IDLE,
        isAvailable: false,
      };

      const mockUser = { id: 'user-1', isActive: true } as User;
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
        date: new Date('2024-01-01'),
        status: AvailabilityStatus.IDLE,
        isAvailable: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastHeartbeat: undefined,
        queuedAt: undefined,
        matchedAt: undefined,
        busyAt: undefined,
        offlineAt: undefined,
        preferences: undefined,
        metadata: undefined,
        user: { id: 'user-1', isActive: true } as User,
        isOnline: false,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      } as Availability;

      userRepository.findOne.mockResolvedValue(mockUser);
      availabilityRepository.findOne.mockResolvedValue(null);
      availabilityRepository.create.mockReturnValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.create(createDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1', isActive: true },
      });
      expect(availabilityRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', date: new Date('2024-01-01') },
      });
      expect(availabilityRepository.create).toHaveBeenCalled();
      expect(availabilityRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const createDto: CreateAvailabilityDto = {
        userId: 'user-1',
        date: '2024-01-01',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when availability already exists', async () => {
      const createDto: CreateAvailabilityDto = {
        userId: 'user-1',
        date: '2024-01-01',
      };

      const mockUser = { id: 'user-1', isActive: true } as User;
      const existingAvailability = { id: 'availability-1' } as Availability;

      userRepository.findOne.mockResolvedValue(mockUser);
      availabilityRepository.findOne.mockResolvedValue(existingAvailability);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active availability records', async () => {
      const mockAvailabilities = [
        { id: 'availability-1', isActive: true } as Availability,
        { id: 'availability-2', isActive: true } as Availability,
      ];

      availabilityRepository.find.mockResolvedValue(mockAvailabilities);

      const result = await service.findAll();

      expect(availabilityRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a specific availability record', async () => {
      const mockAvailability = { id: 'availability-1' } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);

      const result = await service.findOne('availability-1');

      expect(availabilityRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'availability-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when availability not found', async () => {
      availabilityRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return availability records for a specific user', async () => {
      const mockAvailabilities = [
        { id: 'availability-1', userId: 'user-1' } as Availability,
        { id: 'availability-2', userId: 'user-1' } as Availability,
      ];

      availabilityRepository.find.mockResolvedValue(mockAvailabilities);

      const result = await service.findByUserId('user-1');

      expect(availabilityRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        order: { date: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getCurrentAvailability', () => {
    it('should return current user availability', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);

      const result = await service.getCurrentAvailability('user-1');

      expect(result).toBeDefined();
    });

    it('should return null when no current availability', async () => {
      availabilityRepository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentAvailability('user-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an availability record', async () => {
      const updateDto: UpdateAvailabilityDto = {
        status: AvailabilityStatus.QUEUED,
        isAvailable: true,
      };

      const existingAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;
      const updatedAvailability = {
        id: 'availability-1',
        userId: 'user-1',
        date: new Date('2024-01-01'),
        status: AvailabilityStatus.QUEUED,
        isAvailable: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastHeartbeat: undefined,
        queuedAt: undefined,
        matchedAt: undefined,
        busyAt: undefined,
        offlineAt: undefined,
        preferences: undefined,
        metadata: undefined,
        user: { id: 'user-1', isActive: true } as User,
        isOnline: false,
        timeInQueue: 0,
        timeSinceLastHeartbeat: 0,
        canBeMatched: false,
        isExpired: false,
        sessionDuration: 0,
      } as Availability;

      availabilityRepository.findOne
        .mockResolvedValueOnce(existingAvailability)
        .mockResolvedValueOnce(updatedAvailability);
      availabilityRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update(
        'availability-1',
        updateDto,
        'user-1',
      );

      expect(availabilityRepository.update).toHaveBeenCalledWith(
        'availability-1',
        updateDto,
      );
      expect(result).toBeDefined();
    });

    it("should throw ForbiddenException when updating other user's availability", async () => {
      const updateDto: UpdateAvailabilityDto = {
        status: AvailabilityStatus.QUEUED,
      };
      const existingAvailability = {
        id: 'availability-1',
        userId: 'user-2',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(existingAvailability);

      await expect(
        service.update('availability-1', updateDto, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('setStatus', () => {
    it('should set availability status', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.setStatus(
        'user-1',
        AvailabilityStatus.QUEUED,
      );

      expect(availabilityRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create new availability if none exists', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(null);
      availabilityRepository.create.mockReturnValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.setStatus(
        'user-1',
        AvailabilityStatus.QUEUED,
      );

      expect(availabilityRepository.create).toHaveBeenCalled();
      expect(availabilityRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('sendHeartbeat', () => {
    it('should update heartbeat timestamp', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.sendHeartbeat('user-1');

      expect(availabilityRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('joinQueue', () => {
    it('should set status to QUEUED', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.joinQueue('user-1');

      expect(result).toBeDefined();
    });
  });

  describe('leaveQueue', () => {
    it('should set status to IDLE', async () => {
      const mockAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(mockAvailability);
      availabilityRepository.save.mockResolvedValue(mockAvailability);

      const result = await service.leaveQueue('user-1');

      expect(result).toBeDefined();
    });
  });

  describe('getQueuedUsers', () => {
    it('should return queued users', async () => {
      const mockAvailabilities = [
        {
          id: 'availability-1',
          status: AvailabilityStatus.QUEUED,
          isOnline: true,
        } as Availability,
        {
          id: 'availability-2',
          status: AvailabilityStatus.QUEUED,
          isOnline: true,
        } as Availability,
      ];

      availabilityRepository.find.mockResolvedValue(mockAvailabilities);

      const result = await service.getQueuedUsers();

      expect(availabilityRepository.find).toHaveBeenCalledWith({
        where: {
          status: AvailabilityStatus.QUEUED,
          isActive: true,
          isAvailable: true,
        },
        order: { queuedAt: 'ASC' },
        take: 50,
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getOnlineUsers', () => {
    it('should return online users', async () => {
      const mockAvailabilities = [
        { id: 'availability-1', isOnline: true } as Availability,
        { id: 'availability-2', isOnline: true } as Availability,
      ];

      availabilityRepository.find.mockResolvedValue(mockAvailabilities);

      const result = await service.getOnlineUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockAvailabilities = [
        {
          id: 'availability-1',
          status: AvailabilityStatus.QUEUED,
          isOnline: true,
          queuedAt: new Date(),
          timeInQueue: 10,
        } as Availability,
        {
          id: 'availability-2',
          status: AvailabilityStatus.QUEUED,
          isOnline: false,
          queuedAt: new Date(),
          timeInQueue: 20,
        } as Availability,
      ];

      availabilityRepository.find.mockResolvedValue(mockAvailabilities);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        totalQueued: 2,
        onlineQueued: 1,
        averageWaitTime: 15,
        oldestInQueue: 20,
      });
    });
  });

  describe('remove', () => {
    it('should soft delete an availability record', async () => {
      const existingAvailability = {
        id: 'availability-1',
        userId: 'user-1',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(existingAvailability);
      availabilityRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove('availability-1', 'user-1');

      expect(availabilityRepository.update).toHaveBeenCalledWith(
        'availability-1',
        { isActive: false },
      );
    });

    it("should throw ForbiddenException when deleting other user's availability", async () => {
      const existingAvailability = {
        id: 'availability-1',
        userId: 'user-2',
      } as Availability;

      availabilityRepository.findOne.mockResolvedValue(existingAvailability);

      await expect(service.remove('availability-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete an availability record', async () => {
      const existingAvailability = { id: 'availability-1' } as Availability;

      availabilityRepository.findOne.mockResolvedValue(existingAvailability);
      availabilityRepository.remove.mockResolvedValue(existingAvailability);

      await service.hardDelete('availability-1');

      expect(availabilityRepository.remove).toHaveBeenCalledWith(
        existingAvailability,
      );
    });

    it('should throw NotFoundException when availability not found', async () => {
      availabilityRepository.findOne.mockResolvedValue(null);

      await expect(service.hardDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cleanupExpiredAvailabilities', () => {
    it('should delete expired availability records', async () => {
      availabilityRepository.delete.mockResolvedValue({ affected: 5 } as any);

      const result = await service.cleanupExpiredAvailabilities();

      expect(result).toBe(5);
    });
  });

  describe('cleanupOfflineUsers', () => {
    it('should mark offline users', async () => {
      availabilityRepository.update.mockResolvedValue({ affected: 3 } as any);

      const result = await service.cleanupOfflineUsers();

      expect(result).toBe(3);
    });
  });
});
