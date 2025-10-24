import { ApiProperty } from '@nestjs/swagger';
import { MessageType, MessageStatus } from '../entities/message.entity';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Author user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  authorId: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! How are you today?',
  })
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.SENT,
  })
  status: MessageStatus;

  @ApiProperty({
    description: 'Reply to message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  replyToId?: string;

  @ApiProperty({
    description: 'Edit timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  editedAt?: Date;

  @ApiProperty({
    description: 'Delete timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Message deleted status',
    example: false,
  })
  isDeleted: boolean;

  @ApiProperty({
    description: 'Message edited status',
    example: false,
  })
  isEdited: boolean;

  @ApiProperty({
    description: 'Message metadata',
    example: {
      fileUrl: 'https://example.com/file.jpg',
      fileSize: 1024000,
      fileType: 'image/jpeg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      emoji: '😊',
    },
    required: false,
  })
  metadata?: {
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
    emoji?: string;
    systemMessage?: string;
    deliveryAttempts?: number;
    lastDeliveryAttempt?: Date;
  };

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Message last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether message is a system message',
    example: false,
  })
  isSystemMessage: boolean;

  @ApiProperty({
    description: 'Whether message is a media message',
    example: false,
  })
  isMediaMessage: boolean;

  @ApiProperty({
    description: 'Whether message is an emoji message',
    example: false,
  })
  isEmojiMessage: boolean;

  @ApiProperty({
    description: 'Message age in minutes',
    example: 30,
  })
  ageInMinutes: number;

  @ApiProperty({
    description: 'Message age in hours',
    example: 1,
  })
  ageInHours: number;

  @ApiProperty({
    description: 'Message age in days',
    example: 0,
  })
  ageInDays: number;

  @ApiProperty({
    description: 'Formatted message age',
    example: '30m ago',
  })
  formattedAge: string;
}
