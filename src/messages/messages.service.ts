import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Message, MessageType, MessageStatus } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { Conversation } from '../conversations/entities/conversation.entity';
import {
  MESSAGE_CREATED_EVENT,
  MESSAGE_DELETED_EVENT,
  MESSAGE_READ_EVENT,
  MESSAGE_UPDATED_EVENT,
  MessageCreatedEvent,
  MessageDeletedEvent,
  MessageReadEvent,
  MessageUpdatedEvent,
} from './events/message.events';

@Injectable()
export class MessagesService {
  private readonly MAX_MESSAGE_LENGTH = 2000;
  private readonly MESSAGE_RETENTION_DAYS = 2;
  private readonly MAX_EDIT_TIME_MINUTES = 5;

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    authorId: string,
  ): Promise<MessageResponseDto> {
    const { content, conversationId, type, replyToId, metadata } =
      createMessageDto;

    // Validate conversation exists and user is part of it
    const conversation = await this.validateConversationAccess(
      conversationId,
      authorId,
    );

    // Check if conversation is still active
    if (!conversation.isActive || !conversation.isActiveConversation) {
      throw new BadRequestException(
        'Cannot send messages to inactive or expired conversation',
      );
    }

    // Validate reply-to message if provided
    if (replyToId) {
      await this.validateReplyToMessage(replyToId, conversationId);
    }

    // Validate message content based on type
    this.validateMessageContent(content, type || MessageType.TEXT, metadata);

    // Create message
    const message = this.messageRepository.create({
      authorId,
      conversationId,
      content,
      type: type || MessageType.TEXT,
      status: MessageStatus.SENT,
      replyToId,
      isDeleted: false,
      isEdited: false,
      metadata: {
        ...metadata,
        deliveryAttempts: 0,
        lastDeliveryAttempt: new Date(),
      },
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation last message time and count
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
      messageCount: () => 'messageCount + 1',
    });

    const response = this.mapToResponseDto(savedMessage);
    const eventPayload: MessageCreatedEvent = {
      message: response,
      conversationId,
      recipients: [conversation.user1Id, conversation.user2Id],
    };
    this.eventEmitter.emit(MESSAGE_CREATED_EVENT, eventPayload);

    return response;
  }

  async findAll(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageResponseDto[]> {
    //TODO : safe limit à retirer ?
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    return this.findByConversation(
      conversationId,
      userId,
      safeLimit,
      safeOffset,
    );
  }

  async findOne(id: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.mapToResponseDto(message);
  }

  async findByConversation(
    conversationId: string,
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<MessageResponseDto[]> {
    // Validate conversation access
    await this.validateConversationAccess(conversationId, userId);

    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return messages.map((message) => this.mapToResponseDto(message));
  }

  async update(
    id: string,
    updateMessageDto: UpdateMessageDto,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user is the author
    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Check if message can still be edited
    if (message.ageInMinutes > this.MAX_EDIT_TIME_MINUTES) {
      throw new BadRequestException(
        'Message can only be edited within 5 minutes of sending',
      );
    }

    // Check if message is deleted
    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    // Validate updated content
    if (updateMessageDto.content) {
      this.validateMessageContent(
        updateMessageDto.content,
        message.type,
        message.metadata,
      );
    }

    // Update message
    await this.messageRepository.update(id, {
      ...updateMessageDto,
      editedAt: new Date(),
      isEdited: true,
    });

    const updatedMessage = await this.messageRepository.findOne({
      where: { id },
    });

    const response = this.mapToResponseDto(updatedMessage!);
    const eventPayload: MessageUpdatedEvent = {
      message: response,
    };
    this.eventEmitter.emit(MESSAGE_UPDATED_EVENT, eventPayload);

    return response;
  }

  async delete(id: string, userId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Check if user is the author
    if (message.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Check if message is already deleted
    if (message.isDeleted) {
      throw new BadRequestException('Message is already deleted');
    }

    // Soft delete message
    await this.messageRepository.update(id, {
      deletedAt: new Date(),
      isDeleted: true,
      content: '[Message deleted]',
    });

    const updatedMessage = await this.messageRepository.findOne({
      where: { id },
    });

    const response = this.mapToResponseDto(updatedMessage!);
    const eventPayload: MessageDeletedEvent = {
      message: response,
    };
    this.eventEmitter.emit(MESSAGE_DELETED_EVENT, eventPayload);

    return response;
  }

  async acknowledgeDelivery(
    messageId: string,
    userId: string,
  ): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    await this.validateConversationAccess(message.conversationId, userId);

    if (message.authorId === userId) {
      throw new ForbiddenException(
        'You cannot acknowledge delivery for your own message',
      );
    }

    if (
      message.status === MessageStatus.DELIVERED ||
      message.status === MessageStatus.READ
    ) {
      return this.mapToResponseDto(message);
    }

    const metadata = {
      ...(message.metadata ?? {}),
      deliveryAttempts: (message.metadata?.deliveryAttempts ?? 0) + 1,
      lastDeliveryAttempt: new Date(),
    };

    await this.messageRepository.update(messageId, {
      status: MessageStatus.DELIVERED,
      metadata,
    });

    const updatedMessage = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    const response = this.mapToResponseDto(updatedMessage!);
    const eventPayload: MessageUpdatedEvent = {
      message: response,
    };
    this.eventEmitter.emit(MESSAGE_UPDATED_EVENT, eventPayload);

    return response;
  }

  async markAsRead(id: string): Promise<void> {
    await this.messageRepository.update(id, {
      status: MessageStatus.READ,
    });
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Validate conversation access
    const conversation = await this.validateConversationAccess(
      conversationId,
      userId,
    );

    // Mark all messages in conversation as read
    await this.messageRepository.update(
      {
        conversationId,
        authorId: Not(userId), // Not from the current user
        status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
      },
      {
        status: MessageStatus.READ,
      },
    );

    const metadata = {
      ...(conversation.metadata ?? {}),
      lastActivity: new Date(),
    };

    const updateConversation: QueryDeepPartialEntity<Conversation> = {
      metadata,
    };

    if (conversation.user1Id === userId) {
      updateConversation.isReadByUser1 = true;
      metadata.user1LastSeen = new Date();
    } else {
      updateConversation.isReadByUser2 = true;
      metadata.user2LastSeen = new Date();
    }

    await this.conversationRepository.update(conversationId, updateConversation);

    const eventPayload: MessageReadEvent = {
      conversationId,
      userId,
      unreadCount: 0,
    };
    this.eventEmitter.emit(MESSAGE_READ_EVENT, eventPayload);
  }

  async createSystemMessage(
    conversationId: string,
    content: string,
    systemMessageType: string,
  ): Promise<MessageResponseDto> {
    // Validate conversation exists
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Create system message
    const message = this.messageRepository.create({
      authorId: conversation.user1Id, // Use first user as author for system messages
      conversationId,
      content,
      type: MessageType.SYSTEM,
      status: MessageStatus.SENT,
      isDeleted: false,
      isEdited: false,
      metadata: {
        systemMessage: systemMessageType,
        deliveryAttempts: 0,
        lastDeliveryAttempt: new Date(),
      },
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    await this.conversationRepository.update(conversationId, {
      lastMessageAt: new Date(),
      messageCount: () => 'messageCount + 1',
    });

    const response = this.mapToResponseDto(savedMessage);
    const eventPayload: MessageCreatedEvent = {
      message: response,
      conversationId,
      recipients: [conversation.user1Id, conversation.user2Id],
    };
    this.eventEmitter.emit(MESSAGE_CREATED_EVENT, eventPayload);

    return response;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where(
        '(conversation.user1Id = :userId OR conversation.user2Id = :userId)',
        { userId },
      )
      .andWhere('message.authorId != :userId', { userId })
      .andWhere('message.status IN (:...statuses)', {
        statuses: [MessageStatus.SENT, MessageStatus.DELIVERED],
      })
      .andWhere('message.isDeleted = false')
      .getCount();

    return count;
  }

  async getUnreadCountForConversation(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    // Validate conversation access
    await this.validateConversationAccess(conversationId, userId);

    const count = await this.messageRepository.count({
      where: {
        conversationId,
        authorId: Not(userId),
        status: In([MessageStatus.SENT, MessageStatus.DELIVERED]),
        isDeleted: false,
      },
    });

    return count;
  }

  async cleanupExpiredMessages(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MESSAGE_RETENTION_DAYS);

    const result = await this.messageRepository.delete({
      createdAt: Between(new Date(0), cutoffDate),
    });

    return result.affected || 0;
  }

  async searchMessages(
    query: string,
    userId: string,
    conversationId?: string,
    limit = 20,
  ): Promise<MessageResponseDto[]> {
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where(
        '(conversation.user1Id = :userId OR conversation.user2Id = :userId)',
        { userId },
      )
      .andWhere('message.content ILIKE :query', { query: `%${query}%` })
      .andWhere('message.isDeleted = false');

    if (conversationId) {
      queryBuilder.andWhere('message.conversationId = :conversationId', {
        conversationId,
      });
    }

    const messages = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return messages.map((message) => this.mapToResponseDto(message));
  }

  async validateConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    return conversation;
  }

  private async validateReplyToMessage(
    replyToId: string,
    conversationId: string,
  ): Promise<void> {
    const replyToMessage = await this.messageRepository.findOne({
      where: { id: replyToId, conversationId },
    });

    if (!replyToMessage) {
      throw new NotFoundException('Reply-to message not found');
    }

    if (replyToMessage.isDeleted) {
      throw new BadRequestException('Cannot reply to deleted message');
    }
  }

  private validateMessageContent(
    content: string,
    type: MessageType,
    metadata?: any,
  ): void {
    if (content.length > this.MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message content must not exceed ${this.MAX_MESSAGE_LENGTH} characters`,
      );
    }

    switch (type) {
      case MessageType.TEXT:
        if (content.trim().length === 0) {
          throw new BadRequestException('Text message content cannot be empty');
        }
        break;

      case MessageType.IMAGE:
        if (!metadata?.fileUrl) {
          throw new BadRequestException('Image message must include file URL');
        }
        break;

      case MessageType.EMOJI:
        if (!metadata?.emoji) {
          throw new BadRequestException('Emoji message must include emoji');
        }
        break;

      case MessageType.SYSTEM:
        // System messages are validated separately
        break;

      default:
        throw new BadRequestException('Invalid message type');
    }
  }

  private mapToResponseDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      authorId: message.authorId,
      conversationId: message.conversationId,
      content: message.content,
      type: message.type,
      status: message.status,
      replyToId: message.replyToId,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      isDeleted: message.isDeleted,
      isEdited: message.isEdited,
      metadata: message.metadata,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isSystemMessage: message.isSystemMessage,
      isMediaMessage: message.isMediaMessage,
      isEmojiMessage: message.isEmojiMessage,
      ageInMinutes: message.ageInMinutes,
      ageInHours: message.ageInHours,
      ageInDays: message.ageInDays,
      formattedAge: message.formattedAge,
    };
  }
}
