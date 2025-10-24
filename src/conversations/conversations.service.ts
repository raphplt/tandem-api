import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  Conversation,
  ConversationStatus,
  ConversationType,
} from './entities/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { Match } from '../matches/entities/match.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ConversationsService {
  private readonly CONVERSATION_DURATION_HOURS = 24;
  private readonly EXTENSION_DURATION_HOURS = 24;
  private readonly MAX_EXTENSIONS = 3;

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    const { user1Id, user2Id, matchId, startTime, expiresAt } =
      createConversationDto;

    // Validate that users exist and are active
    await this.validateUsersExist([user1Id, user2Id]);

    // Validate that match exists and is accepted
    const match = await this.matchRepository.findOne({
      where: { id: matchId, isActive: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found or inactive');
    }

    if (match.status !== 'accepted') {
      throw new BadRequestException(
        'Match must be accepted to start a conversation',
      );
    }

    // Check for existing conversation between these users
    const existingConversation = await this.findExistingConversation(
      user1Id,
      user2Id,
    );
    if (existingConversation) {
      throw new ConflictException(
        'Conversation already exists between these users',
      );
    }

    // Create conversation
    const conversation = this.conversationRepository.create({
      ...createConversationDto,
      startTime: new Date(startTime),
      expiresAt: new Date(expiresAt),
      extendedAt: createConversationDto.extendedAt
        ? new Date(createConversationDto.extendedAt)
        : undefined,
      isActive: true,
      isReadByUser1: false,
      isReadByUser2: false,
      messageCount: 0,
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);
    return this.mapToResponseDto(savedConversation);
  }

  async findAll(): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository.find({
      where: { isActive: true },
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return conversations.map((conversation) =>
      this.mapToResponseDto(conversation),
    );
  }

  async findOne(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return this.mapToResponseDto(conversation);
  }

  async findByUserId(userId: string): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationRepository.find({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return conversations.map((conversation) =>
      this.mapToResponseDto(conversation),
    );
  }

  async findActiveConversation(
    userId: string,
  ): Promise<ConversationResponseDto | null> {
    const conversation = await this.conversationRepository.findOne({
      where: [
        { user1Id: userId, status: ConversationStatus.ACTIVE, isActive: true },
        { user2Id: userId, status: ConversationStatus.ACTIVE, isActive: true },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!conversation) {
      return null;
    }

    // Check if conversation has expired
    if (conversation.isExpired) {
      await this.expireConversation(conversation.id);
      return null;
    }

    return this.mapToResponseDto(conversation);
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    currentUserId?: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is trying to update someone else's conversation
    if (
      currentUserId &&
      conversation.user1Id !== currentUserId &&
      conversation.user2Id !== currentUserId
    ) {
      throw new ForbiddenException(
        'You can only update your own conversations',
      );
    }

    // Update conversation
    await this.conversationRepository.update(id, updateConversationDto);

    const updatedConversation = await this.conversationRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedConversation!);
  }

  async extendConversation(
    id: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException(
        'You can only extend your own conversations',
      );
    }

    // Check if conversation can be extended
    if (!conversation.canBeExtended) {
      throw new BadRequestException('Conversation cannot be extended');
    }

    // Check extension limit
    const extensionCount = conversation.metadata?.extensionCount || 0;
    if (extensionCount >= this.MAX_EXTENSIONS) {
      throw new BadRequestException('Maximum number of extensions reached');
    }

    // Extend conversation
    const newExpiryTime = new Date(conversation.expiresAt);
    newExpiryTime.setHours(
      newExpiryTime.getHours() + this.EXTENSION_DURATION_HOURS,
    );

    await this.conversationRepository.update(id, {
      expiresAt: newExpiryTime,
      extendedAt: new Date(),
      type: ConversationType.EXTENDED,
      metadata: {
        ...conversation.metadata,
        extensionCount: extensionCount + 1,
        lastActivity: new Date(),
      },
    });

    const updatedConversation = await this.conversationRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedConversation!);
  }

  async closeConversation(
    id: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You can only close your own conversations');
    }

    // Check if conversation can be closed
    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Conversation is already closed');
    }

    // Close conversation
    await this.conversationRepository.update(id, {
      status: ConversationStatus.CLOSED,
      closedAt: new Date(),
    });

    const updatedConversation = await this.conversationRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedConversation!);
  }

  async archiveConversation(
    id: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException(
        'You can only archive your own conversations',
      );
    }

    // Archive conversation
    await this.conversationRepository.update(id, {
      status: ConversationStatus.ARCHIVED,
      archivedAt: new Date(),
    });

    const updatedConversation = await this.conversationRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedConversation!);
  }

  async markAsRead(
    id: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is part of this conversation
    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException(
        'You can only mark your own conversations as read',
      );
    }

    // Mark as read for the appropriate user
    const updateData: any = {
      metadata: {
        ...conversation.metadata,
        lastActivity: new Date(),
      },
    };

    if (conversation.user1Id === userId) {
      updateData.isReadByUser1 = true;
      updateData.metadata.user1LastSeen = new Date();
    } else {
      updateData.isReadByUser2 = true;
      updateData.metadata.user2LastSeen = new Date();
    }

    await this.conversationRepository.update(id, updateData);

    const updatedConversation = await this.conversationRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedConversation!);
  }

  async updateLastMessage(id: string, messageId: string): Promise<void> {
    await this.conversationRepository.update(id, {
      lastMessageAt: new Date(),
      messageCount: () => 'messageCount + 1',
    });
  }

  async expireConversations(): Promise<number> {
    const now = new Date();
    const result = await this.conversationRepository.update(
      {
        status: ConversationStatus.ACTIVE,
        expiresAt: Between(new Date(0), now),
      },
      {
        status: ConversationStatus.EXPIRED,
      },
    );

    return result.affected || 0;
  }

  async expireConversation(id: string): Promise<void> {
    await this.conversationRepository.update(id, {
      status: ConversationStatus.EXPIRED,
    });
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is trying to delete someone else's conversation
    if (
      currentUserId &&
      conversation.user1Id !== currentUserId &&
      conversation.user2Id !== currentUserId
    ) {
      throw new ForbiddenException(
        'You can only delete your own conversations',
      );
    }

    // Soft delete by deactivating the conversation
    await this.conversationRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    await this.conversationRepository.remove(conversation);
  }

  async createFromMatch(matchId: string): Promise<ConversationResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId, isActive: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found or inactive');
    }

    if (match.status !== 'accepted') {
      throw new BadRequestException(
        'Match must be accepted to create a conversation',
      );
    }

    // Check for existing conversation
    const existingConversation = await this.findExistingConversation(
      match.user1Id,
      match.user2Id,
    );
    if (existingConversation) {
      throw new ConflictException('Conversation already exists for this match');
    }

    // Create conversation
    const startTime = new Date();
    const expiresAt = new Date(startTime);
    expiresAt.setHours(expiresAt.getHours() + this.CONVERSATION_DURATION_HOURS);

    const conversation = this.conversationRepository.create({
      user1Id: match.user1Id,
      user2Id: match.user2Id,
      matchId: match.id,
      status: ConversationStatus.ACTIVE,
      type: ConversationType.DAILY,
      startTime,
      expiresAt,
      isActive: true,
      isReadByUser1: false,
      isReadByUser2: false,
      messageCount: 0,
      metadata: {
        timezoneOffset: 0,
        extensionCount: 0,
        lastActivity: startTime,
      },
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);
    return this.mapToResponseDto(savedConversation);
  }

  private async validateUsersExist(userIds: string[]): Promise<void> {
    const users = await this.userRepository.find({
      where: { id: In(userIds), isActive: true },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found or inactive');
    }
  }

  private async findExistingConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<Conversation | null> {
    return this.conversationRepository.findOne({
      where: [
        { user1Id, user2Id, isActive: true },
        { user1Id: user2Id, user2Id: user1Id, isActive: true },
      ],
    });
  }

  private mapToResponseDto(
    conversation: Conversation,
  ): ConversationResponseDto {
    return {
      id: conversation.id,
      user1Id: conversation.user1Id,
      user2Id: conversation.user2Id,
      matchId: conversation.matchId,
      status: conversation.status,
      type: conversation.type,
      startTime: conversation.startTime,
      expiresAt: conversation.expiresAt,
      extendedAt: conversation.extendedAt,
      closedAt: conversation.closedAt,
      archivedAt: conversation.archivedAt,
      isActive: conversation.isActive,
      isReadByUser1: conversation.isReadByUser1,
      isReadByUser2: conversation.isReadByUser2,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messageCount,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isExpired: conversation.isExpired,
      isActiveConversation: conversation.isActiveConversation,
      timeUntilExpiry: conversation.timeUntilExpiry,
      duration: conversation.duration,
      canBeExtended: conversation.canBeExtended,
      hasUnreadMessages: conversation.hasUnreadMessages,
    };
  }
}
