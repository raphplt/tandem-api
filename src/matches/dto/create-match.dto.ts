import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus, MatchType } from '../entities/match.entity';

export class CreateMatchDto {
  @ApiProperty({
    description: 'First user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  user1Id: string;

  @ApiProperty({
    description: 'Second user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  user2Id: string;

  @ApiProperty({
    description: 'First profile ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  profile1Id: string;

  @ApiProperty({
    description: 'Second profile ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  profile2Id: string;

  @ApiPropertyOptional({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.PENDING,
    default: MatchStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MatchStatus, { message: 'Invalid match status' })
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Match type',
    enum: MatchType,
    example: MatchType.DAILY,
    default: MatchType.DAILY,
  })
  @IsOptional()
  @IsEnum(MatchType, { message: 'Invalid match type' })
  type?: MatchType;

  @ApiPropertyOptional({
    description: 'Compatibility score (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Compatibility score must be at least 0' })
  @Max(100, { message: 'Compatibility score must not exceed 100' })
  compatibilityScore?: number;

  @ApiPropertyOptional({
    description: 'Scoring breakdown details',
    example: {
      ageCompatibility: 20,
      locationCompatibility: 15,
      interestCompatibility: 25,
      valueCompatibility: 20,
      responseRateBonus: 5,
      activityBonus: 3,
      verificationBonus: 2,
    },
  })
  @IsOptional()
  @IsObject()
  scoringBreakdown?: {
    ageCompatibility: number;
    locationCompatibility: number;
    interestCompatibility: number;
    valueCompatibility: number;
    responseRateBonus: number;
    activityBonus: number;
    verificationBonus: number;
  };

  @ApiProperty({
    description: 'Match date',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'Please provide a valid match date' })
  matchDate: string;

  @ApiPropertyOptional({
    description: 'Expiration date and time',
    example: '2024-01-02T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid expiration date' })
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Match metadata',
    example: {
      matchingAlgorithm: 'enhanced_v2',
      matchingVersion: '1.0.0',
      timezoneOffset: 0,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    matchingAlgorithm?: string;
    matchingVersion?: string;
    timezoneOffset?: number;
    user1Preferences?: any;
    user2Preferences?: any;
  };
}
