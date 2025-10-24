import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Hello! How are you today?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1, { message: 'Message content cannot be empty' })
  @MaxLength(2000, {
    message: 'Message content must not exceed 2000 characters',
  })
  content: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  conversationId: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: 'Invalid message type' })
  type?: MessageType;

  @ApiPropertyOptional({
    description: 'Reply to message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  replyToId?: string;

  @ApiPropertyOptional({
    description: 'Message metadata',
    example: {
      fileUrl: 'https://example.com/file.jpg',
      fileSize: 1024000,
      fileType: 'image/jpeg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      emoji: '😊',
    },
  })
  @IsOptional()
  @IsObject()
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
}
