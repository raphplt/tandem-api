import { ApiProperty } from '@nestjs/swagger';
import {
  ConversationStatus,
  ConversationType,
} from '../entities/conversation.entity';
import { Profile } from 'src/profiles/entities/profile.entity';

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Conversation unique identifier',
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

  profile1: Profile;

  profile2: Profile;

  @ApiProperty({
    description: 'Match ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  matchId: string;

  @ApiProperty({
    description: 'Conversation status',
    enum: ConversationStatus,
    example: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @ApiProperty({
    description: 'Conversation type',
    enum: ConversationType,
    example: ConversationType.DAILY,
  })
  type: ConversationType;

  @ApiProperty({
    description: 'Conversation start time',
    example: '2024-01-01T00:00:00.000Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Conversation expiration time',
    example: '2024-01-02T00:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Extension timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  extendedAt?: Date;

  @ApiProperty({
    description: 'Closure timestamp',
    example: '2024-01-02T00:00:00.000Z',
    required: false,
  })
  closedAt?: Date;

  @ApiProperty({
    description: 'Archival timestamp',
    example: '2024-01-02T00:00:00.000Z',
    required: false,
  })
  archivedAt?: Date;

  @ApiProperty({
    description: 'Conversation active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Read status by user 1',
    example: false,
  })
  isReadByUser1: boolean;

  @ApiProperty({
    description: 'Read status by user 2',
    example: false,
  })
  isReadByUser2: boolean;

  @ApiProperty({
    description: 'Last message timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  lastMessageAt?: Date;

  @ApiProperty({
    description: 'Message count',
    example: 15,
  })
  messageCount: number;

  @ApiProperty({
    description: 'Conversation metadata',
    example: {
      timezoneOffset: 0,
      extensionCount: 0,
      lastActivity: '2024-01-01T00:00:00.000Z',
    },
    required: false,
  })
  metadata?: {
    timezoneOffset?: number;
    extensionCount?: number;
    lastActivity?: Date;
    user1LastSeen?: Date;
    user2LastSeen?: Date;
  };

  @ApiProperty({
    description: 'Conversation creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Conversation last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether conversation is expired',
    example: false,
  })
  isExpired: boolean;

  @ApiProperty({
    description: 'Whether conversation is active',
    example: true,
  })
  isActiveConversation: boolean;

  @ApiProperty({
    description: 'Hours until conversation expires',
    example: 12,
  })
  timeUntilExpiry: number;

  @ApiProperty({
    description: 'Conversation duration in hours',
    example: 12,
  })
  duration: number;

  @ApiProperty({
    description: 'Whether conversation can be extended',
    example: false,
  })
  canBeExtended: boolean;

  @ApiProperty({
    description: 'Whether conversation has unread messages',
    example: true,
  })
  hasUnreadMessages: boolean;
}
