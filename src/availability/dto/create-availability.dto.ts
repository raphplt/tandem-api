import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus } from '../entities/availability.entity';

export class CreateAvailabilityDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.IDLE,
    default: AvailabilityStatus.IDLE,
  })
  @IsOptional()
  @IsEnum(AvailabilityStatus, { message: 'Invalid availability status' })
  status?: AvailabilityStatus;

  @ApiProperty({
    description: 'Availability date',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'Please provide a valid date' })
  date: string;

  @ApiPropertyOptional({
    description: 'Whether user is available for matching',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'User preferences',
    example: {
      timezone: 'Europe/Paris',
      timezoneOffset: 60,
      preferredMatchingTime: '20:00',
      maxWaitTime: 30,
      autoMatch: true,
    },
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    timezone?: string;
    timezoneOffset?: number;
    preferredMatchingTime?: string;
    maxWaitTime?: number;
    autoMatch?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Availability metadata',
    example: {
      deviceInfo: {
        platform: 'iOS',
        version: '17.0',
        userAgent: 'TandemApp/1.0.0',
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
  })
  @IsOptional()
  @IsObject()
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
}
