import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Availability,
  AvailabilityStatus,
} from '../availability/entities/availability.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { MatchesService } from './matches.service';
import { MatchResponseDto } from './dto/match-response.dto';
import { CreateMatchDto } from './dto/create-match.dto';
import { MatchType } from './entities/match.entity';
import { AvailabilityService } from '../availability/availability.service';
import {
  TEST_ACCOUNT_FIXTURES,
  TestAccountFixture,
} from '../test-accounts/test-accounts.fixtures';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private isProcessing = false;
  private readonly testAccounts = TEST_ACCOUNT_FIXTURES;
  private readonly testAccountIds = new Set(
    TEST_ACCOUNT_FIXTURES.map((fixture) => fixture.userId),
  );
  private testAccountCursor = 0;

  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly matchesService: MatchesService,
    private readonly availabilityService: AvailabilityService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleQueueProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const matches = await this.processQueue();
      if (matches.length > 0) {
        this.logger.log(`Created ${matches.length} daily matches from queue`);
      }
    } catch (error) {
      this.logger.error('Failed to process match queue', error.stack ?? error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processQueue(date: Date = new Date()): Promise<MatchResponseDto[]> {
    const today = this.getDayStart(date);
    const queued = await this.availabilityRepository.find({
      where: {
        date: today,
        status: AvailabilityStatus.QUEUED,
        isActive: true,
        isAvailable: true,
      },
      order: { queuedAt: 'ASC' },
    });

    if (!queued.length) {
      return [];
    }

    const activeCandidates = queued.filter((entry) => entry.isOnline);
    const usedUsers = new Set<string>();
    const matches: MatchResponseDto[] = [];

    for (let i = 0; i < activeCandidates.length; i++) {
      const first = activeCandidates[i];
      if (!first || usedUsers.has(first.userId)) {
        continue;
      }

      const second = this.findPartner(activeCandidates, i + 1, usedUsers);
      if (!second) {
        const virtualMatch = await this.matchWithTestAccount(first);
        if (virtualMatch) {
          matches.push(virtualMatch);
          usedUsers.add(first.userId);
          await this.availabilityService.markAsMatched(first.userId);
        }
        continue;
      }

      try {
        const match = await this.createMatchPair(first, second);
        if (match) {
          matches.push(match);
          usedUsers.add(first.userId);
          usedUsers.add(second.userId);
          await Promise.all([
            this.availabilityService.markAsMatched(first.userId),
            this.availabilityService.markAsMatched(second.userId),
          ]);
        }
      } catch (error) {
        this.logger.warn(
          `Unable to match ${first.userId} with ${second.userId}: ${error.message}`,
        );
      }
    }

    return matches;
  }

  private async createMatchPair(
    first: Availability,
    second: Availability,
  ): Promise<MatchResponseDto | null> {
    const [firstProfile, secondProfile] = await Promise.all([
      this.profileRepository.findOne({
        where: { userId: first.userId, isActive: true, isComplete: true },
      }),
      this.profileRepository.findOne({
        where: { userId: second.userId, isActive: true, isComplete: true },
      }),
    ]);

    if (!firstProfile || !secondProfile) {
      this.logger.warn(
        `Profiles missing for users ${first.userId} or ${second.userId}, skipping`,
      );
      return null;
    }

    const payload: CreateMatchDto = {
      user1Id: first.userId,
      user2Id: second.userId,
      profile1Id: firstProfile.id,
      profile2Id: secondProfile.id,
      matchDate: new Date().toISOString(),
      type: MatchType.DAILY,
      metadata: {
        matchingAlgorithm: 'queue_pairing_v1',
        matchingVersion: '1.0.0',
        queuedAt: {
          user1: first.queuedAt,
          user2: second.queuedAt,
        },
      },
    };

    return this.matchesService.create(payload);
  }

  private findPartner(
    candidates: Availability[],
    startIndex: number,
    usedUsers: Set<string>,
  ): Availability | null {
    for (let i = startIndex; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (!candidate) continue;
      if (usedUsers.has(candidate.userId)) continue;
      if (!candidate.isOnline) continue;

      return candidate;
    }

    return null;
  }

  private getDayStart(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private get areTestAccountsEnabled(): boolean {
    return this.configService.get<boolean>(
      'features.testAccountsEnabled',
      false,
    );
  }

  private pickTestAccount(excludeUserId: string): TestAccountFixture | null {
    if (!this.testAccounts.length) {
      return null;
    }

    for (let i = 0; i < this.testAccounts.length; i++) {
      const index = (this.testAccountCursor + i) % this.testAccounts.length;
      const candidate = this.testAccounts[index];

      if (candidate.userId === excludeUserId) {
        continue;
      }

      this.testAccountCursor = index + 1;
      return candidate;
    }

    return null;
  }

  private async matchWithTestAccount(
    availability: Availability,
  ): Promise<MatchResponseDto | null> {
    if (
      !this.areTestAccountsEnabled ||
      this.testAccountIds.has(availability.userId)
    ) {
      return null;
    }

    const userProfile = await this.profileRepository.findOne({
      where: { userId: availability.userId, isActive: true, isComplete: true },
    });

    if (!userProfile) {
      return null;
    }

    const testAccount = this.pickTestAccount(availability.userId);
    if (!testAccount) {
      return null;
    }

    const testProfile = await this.profileRepository.findOne({
      where: { id: testAccount.profileId, isActive: true, isComplete: true },
    });

    if (!testProfile) {
      this.logger.warn(
        `Test profile ${testAccount.profileId} missing, cannot create fallback match`,
      );
      return null;
    }

    const payload: CreateMatchDto = {
      user1Id: userProfile.userId,
      user2Id: testAccount.userId,
      profile1Id: userProfile.id,
      profile2Id: testAccount.profileId,
      matchDate: new Date().toISOString(),
      type: MatchType.DAILY,
      compatibilityScore: 95,
      metadata: {
        matchingAlgorithm: 'queue_pairing_v1',
        matchingVersion: '1.0.0',
        testAccountSlug: testAccount.slug,
        isTestAccountMatch: true,
      },
    };

    try {
      const match = await this.matchesService.create(payload, {
        skipDailyLimitFor: [testAccount.userId],
        autoAcceptUserIds: [testAccount.userId],
      });
      this.logger.log(
        `Matched ${availability.userId} with test account ${testAccount.slug}`,
      );
      return match;
    } catch (error) {
      this.logger.warn(
        `Unable to match ${availability.userId} with test account ${testAccount.userId}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }
}
