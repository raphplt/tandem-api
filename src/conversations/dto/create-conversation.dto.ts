import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConversationStatus,
  ConversationType,
} from '../entities/conversation.entity';

export class CreateConversationDto {
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
    description: 'Match ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  matchId: string;

  @ApiPropertyOptional({
    description: 'Conversation status',
    enum: ConversationStatus,
    example: ConversationStatus.ACTIVE,
    default: ConversationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ConversationStatus, { message: 'Invalid conversation status' })
  status?: ConversationStatus;

  @ApiPropertyOptional({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.DAILY,
    default: ConversationType.DAILY,
  })
  @IsOptional()
  @IsEnum(ConversationType, { message: 'Invalid conversation type' })
  type?: ConversationType;

  @ApiProperty({
    description: 'Conversation start time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Please provide a valid start time' })
  startTime: string;

  @ApiProperty({
    description: 'Conversation expiration time',
    example: '2024-01-02T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Please provide a valid expiration time' })
  expiresAt: string;

  @ApiPropertyOptional({
    description: 'Extension timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid extension time' })
  extendedAt?: string;

  @ApiPropertyOptional({
    description: 'Conversation metadata',
    example: {
      timezoneOffset: 0,
      extensionCount: 0,
      lastActivity: '2024-01-01T00:00:00.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    timezoneOffset?: number;
    extensionCount?: number;
    lastActivity?: Date;
    user1LastSeen?: Date;
    user2LastSeen?: Date;
  };
}
