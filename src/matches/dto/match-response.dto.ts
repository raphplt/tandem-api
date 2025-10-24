import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus, MatchType } from '../entities/match.entity';

export class MatchResponseDto {
  @ApiProperty({
    description: 'Match unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'First user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user1Id: string;

  @ApiProperty({
    description: 'Second user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user2Id: string;

  @ApiProperty({
    description: 'First profile ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  profile1Id: string;

  @ApiProperty({
    description: 'Second profile ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  profile2Id: string;

  @ApiProperty({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @ApiProperty({
    description: 'Match type',
    enum: MatchType,
    example: MatchType.DAILY,
  })
  type: MatchType;

  @ApiProperty({
    description: 'Compatibility score (0-100)',
    example: 85.5,
  })
  compatibilityScore: number;

  @ApiProperty({
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
    required: false,
  })
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
    example: '2024-01-01T00:00:00.000Z',
  })
  matchDate: Date;

  @ApiProperty({
    description: 'Expiration date and time',
    example: '2024-01-02T00:00:00.000Z',
    required: false,
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Acceptance timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  acceptedAt?: Date;

  @ApiProperty({
    description: 'Rejection timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  rejectedAt?: Date;

  @ApiProperty({
    description: 'Cancellation timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Expiration timestamp',
    example: '2024-01-02T00:00:00.000Z',
    required: false,
  })
  expiredAt?: Date;

  @ApiProperty({
    description: 'Match active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Mutual match status',
    example: false,
  })
  isMutual: boolean;

  @ApiProperty({
    description: 'Match metadata',
    example: {
      matchingAlgorithm: 'enhanced_v2',
      matchingVersion: '1.0.0',
      timezoneOffset: 0,
    },
    required: false,
  })
  metadata?: {
    matchingAlgorithm?: string;
    matchingVersion?: string;
    timezoneOffset?: number;
    user1Preferences?: any;
    user2Preferences?: any;
  };

  @ApiProperty({
    description: 'Match creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Match last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether match is expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether match is pending',
    example: true,
  })
  isPending: boolean;

  @ApiProperty({
    description: 'Whether match is accepted',
    example: false,
  })
  isAccepted: boolean;

  @ApiProperty({
    description: 'Whether match is rejected',
    example: false,
  })
  isRejected: boolean;

  @ApiProperty({
    description: 'Days since match was created',
    example: 1,
  })
  daysSinceMatch: number;

  @ApiProperty({
    description: 'Hours until match expires',
    example: 12,
    required: false,
  })
  timeUntilExpiry?: number;
}
