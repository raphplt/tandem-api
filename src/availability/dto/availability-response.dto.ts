import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityStatus } from '../entities/availability.entity';

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'Availability unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.QUEUED,
  })
  status: AvailabilityStatus;

  @ApiProperty({
    description: 'Availability date',
    example: '2024-01-01T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Last heartbeat timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  lastHeartbeat?: Date;

  @ApiProperty({
    description: 'Queue timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  queuedAt?: Date;

  @ApiProperty({
    description: 'Match timestamp',
    example: '2024-01-01T12:30:00.000Z',
    required: false,
  })
  matchedAt?: Date;

  @ApiProperty({
    description: 'Busy timestamp',
    example: '2024-01-01T13:00:00.000Z',
    required: false,
  })
  busyAt?: Date;

  @ApiProperty({
    description: 'Offline timestamp',
    example: '2024-01-01T14:00:00.000Z',
    required: false,
  })
  offlineAt?: Date;

  @ApiProperty({
    description: 'Availability active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether user is available for matching',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'User preferences',
    example: {
      timezone: 'Europe/Paris',
      timezoneOffset: 60,
      preferredMatchingTime: '20:00',
      maxWaitTime: 30,
      autoMatch: true,
    },
    required: false,
  })
  preferences?: {
    timezone?: string;
    timezoneOffset?: number;
    preferredMatchingTime?: string;
    maxWaitTime?: number;
    autoMatch?: boolean;
  };

  @ApiProperty({
    description: 'Availability metadata',
    example: {
      deviceInfo: {
        platform: 'iOS',
        version: '17.0',
        userAgent: 'FlintApp/1.0.0',
      },
      location: {
        latitude: 48.8566,
        longitude: 2.3522,
        city: 'Paris',
        country: 'France',
      },
      networkInfo: {
        connectionType: 'wifi',
        isOnline: true,
      },
    },
    required: false,
  })
  metadata?: {
    deviceInfo?: {
      platform?: string;
      version?: string;
      userAgent?: string;
    };
    location?: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
    };
    networkInfo?: {
      connectionType?: string;
      isOnline?: boolean;
    };
    lastActivity?: Date;
    sessionDuration?: number;
  };

  @ApiProperty({
    description: 'Availability creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Availability last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether user is online',
    example: true,
  })
  isOnline: boolean;

  @ApiProperty({
    description: 'Time in queue in minutes',
    example: 15,
  })
  timeInQueue: number;

  @ApiProperty({
    description: 'Time since last heartbeat in minutes',
    example: 2,
  })
  timeSinceLastHeartbeat: number;

  @ApiProperty({
    description: 'Whether user can be matched',
    example: true,
  })
  canBeMatched: boolean;

  @ApiProperty({
    description: 'Whether availability is expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Session duration in minutes',
    example: 45,
  })
  sessionDuration: number;
}
