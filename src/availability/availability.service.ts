import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Availability,
  AvailabilityStatus,
} from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AvailabilityService {
  private readonly HEARTBEAT_TIMEOUT_MINUTES = 5;
  private readonly MAX_QUEUE_TIME_MINUTES = 60;
  private readonly CLEANUP_INTERVAL_HOURS = 24;

  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const { userId, date, status, isAvailable, preferences, metadata } =
      createAvailabilityDto;

    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check for existing availability for this date
    const existingAvailability = await this.availabilityRepository.findOne({
      where: { userId, date: new Date(date) },
    });

    if (existingAvailability) {
      throw new ConflictException('Availability already exists for this date');
    }

    // Create availability
    const availability = this.availabilityRepository.create({
      userId,
      date: new Date(date),
      status: status || AvailabilityStatus.IDLE,
      isAvailable: isAvailable || false,
      preferences,
      metadata: {
        ...metadata,
        lastActivity: new Date(),
      },
      isActive: true,
    });

    const savedAvailability =
      await this.availabilityRepository.save(availability);
    return this.mapToResponseDto(savedAvailability);
  }

  async findAll(): Promise<AvailabilityResponseDto[]> {
    const availabilities = await this.availabilityRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return availabilities.map((availability) =>
      this.mapToResponseDto(availability),
    );
  }

  async findOne(id: string): Promise<AvailabilityResponseDto> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return this.mapToResponseDto(availability);
  }

  async findByUserId(userId: string): Promise<AvailabilityResponseDto[]> {
    const availabilities = await this.availabilityRepository.find({
      where: { userId, isActive: true },
      order: { date: 'DESC' },
    });

    return availabilities.map((availability) =>
      this.mapToResponseDto(availability),
    );
  }

  async findByDate(date: string): Promise<AvailabilityResponseDto[]> {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const availabilities = await this.availabilityRepository.find({
      where: {
        date: Between(targetDate, nextDay),
        isActive: true,
      },
      order: { createdAt: 'ASC' },
    });

    return availabilities.map((availability) =>
      this.mapToResponseDto(availability),
    );
  }

  async getCurrentAvailability(
    userId: string,
  ): Promise<AvailabilityResponseDto | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availability = await this.availabilityRepository.findOne({
      where: { userId, date: today, isActive: true },
    });

    if (!availability) {
      return null;
    }

    return this.mapToResponseDto(availability);
  }

  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
    currentUserId?: string,
  ): Promise<AvailabilityResponseDto> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    // Check if user is trying to update someone else's availability
    if (currentUserId && availability.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own availability');
    }

    // Update availability
    await this.availabilityRepository.update(id, updateAvailabilityDto);

    const updatedAvailability = await this.availabilityRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedAvailability!);
  }

  async setStatus(
    userId: string,
    status: AvailabilityStatus,
    metadata?: any,
  ): Promise<AvailabilityResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let availability = await this.availabilityRepository.findOne({
      where: { userId, date: today, isActive: true },
    });

    if (!availability) {
      // Create new availability if none exists
      availability = this.availabilityRepository.create({
        userId,
        date: today,
        status,
        isAvailable: status === AvailabilityStatus.QUEUED,
        isActive: true,
        metadata: {
          lastActivity: new Date(),
        },
      });
    } else {
      // Update existing availability
      availability.status = status;
      availability.isAvailable = status === AvailabilityStatus.QUEUED;

      // Set appropriate timestamp based on status
      const now = new Date();
      switch (status) {
        case AvailabilityStatus.QUEUED:
          availability.queuedAt = now;
          break;
        case AvailabilityStatus.MATCHED:
          availability.matchedAt = now;
          break;
        case AvailabilityStatus.BUSY:
          availability.busyAt = now;
          break;
        case AvailabilityStatus.OFFLINE:
          availability.offlineAt = now;
          break;
      }
    }

    // Update metadata
    if (metadata) {
      availability.metadata = {
        ...availability.metadata,
        ...metadata,
        lastActivity: new Date(),
      };
    }

    const savedAvailability =
      await this.availabilityRepository.save(availability);
    return this.mapToResponseDto(savedAvailability);
  }

  async sendHeartbeat(
    userId: string,
    metadata?: any,
  ): Promise<AvailabilityResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let availability = await this.availabilityRepository.findOne({
      where: { userId, date: today, isActive: true },
    });

    if (!availability) {
      // Create new availability if none exists
      availability = this.availabilityRepository.create({
        userId,
        date: today,
        status: AvailabilityStatus.IDLE,
        isAvailable: false,
        isActive: true,
        metadata: {
          lastActivity: new Date(),
        },
      });
    }

    // Update heartbeat and metadata
    availability.lastHeartbeat = new Date();
    if (metadata) {
      availability.metadata = {
        ...availability.metadata,
        ...metadata,
        lastActivity: new Date(),
      };
    }

    const savedAvailability =
      await this.availabilityRepository.save(availability);
    return this.mapToResponseDto(savedAvailability);
  }

  async joinQueue(
    userId: string,
    preferences?: any,
  ): Promise<AvailabilityResponseDto> {
    return this.setStatus(userId, AvailabilityStatus.QUEUED, preferences);
  }

  async leaveQueue(userId: string): Promise<AvailabilityResponseDto> {
    return this.setStatus(userId, AvailabilityStatus.IDLE);
  }

  async markAsMatched(userId: string): Promise<AvailabilityResponseDto> {
    return this.setStatus(userId, AvailabilityStatus.MATCHED);
  }

  async markAsBusy(userId: string): Promise<AvailabilityResponseDto> {
    return this.setStatus(userId, AvailabilityStatus.BUSY);
  }

  async markAsOffline(userId: string): Promise<AvailabilityResponseDto> {
    return this.setStatus(userId, AvailabilityStatus.OFFLINE);
  }

  async getQueuedUsers(limit = 50): Promise<AvailabilityResponseDto[]> {
    const availabilities = await this.availabilityRepository.find({
      where: {
        status: AvailabilityStatus.QUEUED,
        isActive: true,
        isAvailable: true,
      },
      order: { queuedAt: 'ASC' },
      take: limit,
    });

    // Filter out users who haven't sent heartbeat recently
    const activeAvailabilities = availabilities.filter(
      (availability) => availability.isOnline,
    );

    return activeAvailabilities.map((availability) =>
      this.mapToResponseDto(availability),
    );
  }

  async getOnlineUsers(limit = 100): Promise<AvailabilityResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilities = await this.availabilityRepository.find({
      where: {
        date: today,
        isActive: true,
      },
      order: { lastHeartbeat: 'DESC' },
      take: limit,
    });

    // Filter out users who haven't sent heartbeat recently
    const onlineAvailabilities = availabilities.filter(
      (availability) => availability.isOnline,
    );

    return onlineAvailabilities.map((availability) =>
      this.mapToResponseDto(availability),
    );
  }

  async cleanupExpiredAvailabilities(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days

    const result = await this.availabilityRepository.delete({
      date: Between(new Date(0), cutoffDate),
    });

    return result.affected || 0;
  }

  async cleanupOfflineUsers(): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(
      cutoffTime.getMinutes() - this.HEARTBEAT_TIMEOUT_MINUTES,
    );

    const result = await this.availabilityRepository.update(
      {
        lastHeartbeat: Between(new Date(0), cutoffTime),
        status: AvailabilityStatus.QUEUED,
      },
      {
        status: AvailabilityStatus.OFFLINE,
        offlineAt: new Date(),
      },
    );

    return result.affected || 0;
  }

  async getQueueStats(): Promise<{
    totalQueued: number;
    onlineQueued: number;
    averageWaitTime: number;
    oldestInQueue: number;
  }> {
    const queuedAvailabilities = await this.availabilityRepository.find({
      where: {
        status: AvailabilityStatus.QUEUED,
        isActive: true,
      },
    });

    const onlineQueued = queuedAvailabilities.filter((a) => a.isOnline).length;
    const totalQueued = queuedAvailabilities.length;

    const waitTimes = queuedAvailabilities
      .filter((a) => a.queuedAt)
      .map((a) => a.timeInQueue);

    const averageWaitTime =
      waitTimes.length > 0
        ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
        : 0;

    const oldestInQueue = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    return {
      totalQueued,
      onlineQueued,
      averageWaitTime: Math.round(averageWaitTime),
      oldestInQueue,
    };
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    // Check if user is trying to delete someone else's availability
    if (currentUserId && availability.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own availability');
    }

    // Soft delete by deactivating the availability
    await this.availabilityRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    await this.availabilityRepository.remove(availability);
  }

  private mapToResponseDto(
    availability: Availability,
  ): AvailabilityResponseDto {
    return {
      id: availability.id,
      userId: availability.userId,
      status: availability.status,
      date: availability.date,
      lastHeartbeat: availability.lastHeartbeat,
      queuedAt: availability.queuedAt,
      matchedAt: availability.matchedAt,
      busyAt: availability.busyAt,
      offlineAt: availability.offlineAt,
      isActive: availability.isActive,
      isAvailable: availability.isAvailable,
      preferences: availability.preferences,
      metadata: availability.metadata,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
      isOnline: availability.isOnline,
      timeInQueue: availability.timeInQueue,
      timeSinceLastHeartbeat: availability.timeSinceLastHeartbeat,
      canBeMatched: availability.canBeMatched,
      isExpired: availability.isExpired,
      sessionDuration: availability.sessionDuration,
    };
  }
}
