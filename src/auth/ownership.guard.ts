import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { Availability } from '../availability/entities/availability.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Match } from '../matches/entities/match.entity';
import { Message } from '../messages/entities/message.entity';
import { UserRole } from 'src/common/enums/user.enums';

type ConversationCache = Map<string, Conversation>;

@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly profileRepository: Repository<Profile>;
  private readonly availabilityRepository: Repository<Availability>;
  private readonly conversationRepository: Repository<Conversation>;
  private readonly matchRepository: Repository<Match>;
  private readonly messageRepository: Repository<Message>;

  constructor(private readonly dataSource: DataSource) {
    this.profileRepository = this.dataSource.getRepository(Profile);
    this.availabilityRepository = this.dataSource.getRepository(Availability);
    this.conversationRepository = this.dataSource.getRepository(Conversation);
    this.matchRepository = this.dataSource.getRepository(Match);
    this.messageRepository = this.dataSource.getRepository(Message);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (this.isAdmin(user)) {
      return true;
    }

    const conversationCache: ConversationCache = new Map();

    await this.verifyUserScopedAccess(request, user.id);
    await this.verifyProfileAccess(request, user.id);
    await this.verifyAvailabilityAccess(request, user.id);
    await this.verifyConversationAccess(request, user.id, conversationCache);
    await this.verifyMatchAccess(request, user.id);
    await this.verifyMessageAccess(request, user.id, conversationCache);

    return true;
  }

  private isAdmin(user: any): boolean {
    return Array.isArray(user.roles) && user.roles.includes(UserRole.ADMIN);
  }

  private async verifyUserScopedAccess(request: any, userId: string) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    if (!baseUrl.includes('/users')) {
      return;
    }

    const candidate = this.extractFirst(['id', 'userId'], request);
    if (candidate && candidate !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own user record',
      );
    }
  }

  private async verifyProfileAccess(request: any, userId: string) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    if (!baseUrl.includes('/profiles')) {
      return;
    }

    const profileId = this.extractFirst(['id', 'profileId'], request);
    if (!profileId) {
      return;
    }

    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only access your own profile',
      );
    }
  }

  private async verifyAvailabilityAccess(request: any, userId: string) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    if (!baseUrl.includes('/availability')) {
      return;
    }

    const availabilityIds = this.extractAll(['id', 'availabilityId'], request);
    for (const availabilityId of availabilityIds) {
      const availability = await this.availabilityRepository.findOne({
        where: { id: availabilityId },
      });

      if (!availability) {
        throw new NotFoundException('Availability not found');
      }

      if (availability.userId !== userId) {
        throw new ForbiddenException(
          'Access denied: You can only manage your own availability',
        );
      }
    }
  }

  private async verifyConversationAccess(
    request: any,
    userId: string,
    cache: ConversationCache,
  ) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    const conversationIds = new Set(
      this.extractAll(['conversationId'], request),
    );

    if (baseUrl.includes('/conversations')) {
      this.extractAll(['id'], request).forEach((id) =>
        conversationIds.add(id),
      );
    }

    for (const conversationId of conversationIds) {
      await this.ensureConversationOwnership(conversationId, userId, cache);
    }
  }

  private async verifyMatchAccess(request: any, userId: string) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    const matchIds = new Set(this.extractAll(['matchId'], request));

    if (baseUrl.includes('/matches')) {
      this.extractAll(['id'], request).forEach((id) => matchIds.add(id));
    }

    for (const matchId of matchIds) {
      const match = await this.matchRepository.findOne({
        where: { id: matchId },
      });

      if (!match) {
        throw new NotFoundException('Match not found');
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new ForbiddenException(
          'Access denied: You are not part of this match',
        );
      }
    }
  }

  private async verifyMessageAccess(
    request: any,
    userId: string,
    cache: ConversationCache,
  ) {
    const baseUrl = (request.baseUrl ?? '').toLowerCase();
    const keys = baseUrl.includes('/messages')
      ? ['messageId', 'id']
      : ['messageId'];
    const messageIds = this.extractAll(keys, request);

    for (const messageId of messageIds) {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      await this.ensureConversationOwnership(
        message.conversationId,
        userId,
        cache,
      );
    }
  }

  private async ensureConversationOwnership(
    conversationId: string,
    userId: string,
    cache: ConversationCache,
  ): Promise<Conversation> {
    if (cache.has(conversationId)) {
      return cache.get(conversationId)!;
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (
      conversation.user1Id !== userId &&
      conversation.user2Id !== userId
    ) {
      throw new ForbiddenException(
        'Access denied: You are not part of this conversation',
      );
    }

    cache.set(conversationId, conversation);
    return conversation;
  }

  private extractAll(keys: string[], request: any): string[] {
    const values = new Set<string>();
    const sources = [request.params ?? {}, request.query ?? {}, request.body];

    for (const key of keys) {
      for (const source of sources) {
        if (!source || typeof source !== 'object') {
          continue;
        }

        const value = source[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          values.add(value.trim());
        }
      }
    }

    return Array.from(values);
  }

  private extractFirst(keys: string[], request: any): string | undefined {
    return this.extractAll(keys, request)[0];
  }
}
