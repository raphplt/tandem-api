import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Match, MatchStatus, MatchType } from './entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MatchesService {
  private readonly MATCH_EXPIRY_HOURS = 24;
  private readonly MIN_COMPATIBILITY_SCORE = 60;
  private readonly MAX_DAILY_MATCHES = 1;
  private readonly SCORING_WEIGHTS = {
    ageCompatibility: 0.2,
    locationCompatibility: 0.15,
    interestCompatibility: 0.25,
    valueCompatibility: 0.2,
    responseRateBonus: 0.1,
    activityBonus: 0.05,
    verificationBonus: 0.05,
  };

  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<MatchResponseDto> {
    const { user1Id, user2Id, profile1Id, profile2Id, matchDate } =
      createMatchDto;

    // Validate that users exist and are active
    await this.validateUsersExist([user1Id, user2Id]);

    // Validate that profiles exist and are active
    await this.validateProfilesExist([profile1Id, profile2Id]);

    // Check for existing match between these users
    const existingMatch = await this.findExistingMatch(user1Id, user2Id);
    if (existingMatch) {
      throw new ConflictException('Match already exists between these users');
    }

    // Check if users already have daily matches
    await this.validateDailyMatchLimit(user1Id, user2Id, matchDate);

    // Calculate compatibility score if not provided
    const compatibilityScore =
      createMatchDto.compatibilityScore ||
      (await this.calculateCompatibilityScore(profile1Id, profile2Id));

    // Validate minimum compatibility score
    if (compatibilityScore < this.MIN_COMPATIBILITY_SCORE) {
      throw new BadRequestException(
        `Compatibility score ${compatibilityScore} is below minimum threshold ${this.MIN_COMPATIBILITY_SCORE}`,
      );
    }

    // Create match
    const match = this.matchRepository.create({
      ...createMatchDto,
      compatibilityScore,
      matchDate: new Date(matchDate),
      expiresAt: createMatchDto.expiresAt
        ? new Date(createMatchDto.expiresAt)
        : this.calculateExpiryTime(),
      isActive: true,
      isMutual: false,
    });

    const savedMatch = await this.matchRepository.save(match);
    return this.mapToResponseDto(savedMatch);
  }

  async findAll(): Promise<MatchResponseDto[]> {
    const matches = await this.matchRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return matches.map((match) => this.mapToResponseDto(match));
  }

  async findOne(id: string): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.mapToResponseDto(match);
  }

  async findByUserId(userId: string): Promise<MatchResponseDto[]> {
    const matches = await this.matchRepository.find({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
      order: { createdAt: 'DESC' },
    });

    return matches.map((match) => this.mapToResponseDto(match));
  }

  async findDailyMatch(
    userId: string,
    date: string,
  ): Promise<MatchResponseDto | null> {
    const matchDate = new Date(date);
    const nextDay = new Date(matchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const match = await this.matchRepository.findOne({
      where: {
        user1Id: userId,
        matchDate: Between(matchDate, nextDay),
        isActive: true,
        type: MatchType.DAILY,
      },
    });

    if (!match) {
      const match2 = await this.matchRepository.findOne({
        where: {
          user2Id: userId,
          matchDate: Between(matchDate, nextDay),
          isActive: true,
          type: MatchType.DAILY,
        },
      });
      return match2 ? this.mapToResponseDto(match2) : null;
    }

    return this.mapToResponseDto(match);
  }

  async update(
    id: string,
    updateMatchDto: UpdateMatchDto,
    currentUserId?: string,
  ): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Check if user is trying to update someone else's match
    if (
      currentUserId &&
      match.user1Id !== currentUserId &&
      match.user2Id !== currentUserId
    ) {
      throw new ForbiddenException('You can only update your own matches');
    }

    // Update match
    await this.matchRepository.update(id, updateMatchDto);

    const updatedMatch = await this.matchRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedMatch!);
  }

  async acceptMatch(id: string, userId: string): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Check if user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You can only accept your own matches');
    }

    // Check if match is still pending
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }

    // Check if match has expired
    if (match.isExpired) {
      throw new BadRequestException('Match has expired');
    }

    // Update match status
    await this.matchRepository.update(id, {
      status: MatchStatus.ACCEPTED,
      acceptedAt: new Date(),
      isMutual: true,
    });

    const updatedMatch = await this.matchRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedMatch!);
  }

  async rejectMatch(id: string, userId: string): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Check if user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You can only reject your own matches');
    }

    // Check if match is still pending
    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not pending');
    }

    // Update match status
    await this.matchRepository.update(id, {
      status: MatchStatus.REJECTED,
      rejectedAt: new Date(),
    });

    const updatedMatch = await this.matchRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedMatch!);
  }

  async cancelMatch(id: string, userId: string): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Check if user is part of this match
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You can only cancel your own matches');
    }

    // Check if match can be cancelled
    if (match.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Match is already cancelled');
    }

    // Update match status
    await this.matchRepository.update(id, {
      status: MatchStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    const updatedMatch = await this.matchRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedMatch!);
  }

  async expireMatches(): Promise<number> {
    const now = new Date();
    const result = await this.matchRepository.update(
      {
        status: MatchStatus.PENDING,
        expiresAt: Between(new Date(0), now),
      },
      {
        status: MatchStatus.EXPIRED,
        expiredAt: now,
      },
    );

    return result.affected || 0;
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Check if user is trying to delete someone else's match
    if (
      currentUserId &&
      match.user1Id !== currentUserId &&
      match.user2Id !== currentUserId
    ) {
      throw new ForbiddenException('You can only delete your own matches');
    }

    // Soft delete by deactivating the match
    await this.matchRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const match = await this.matchRepository.findOne({
      where: { id },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    await this.matchRepository.remove(match);
  }

  async generateDailyMatches(date: string): Promise<MatchResponseDto[]> {
    const matchDate = new Date(date);

    // Get all active profiles for the day
    const profiles = await this.profileRepository.find({
      where: { isActive: true, isComplete: true },
    });

    const matches: Match[] = [];
    const usedProfiles = new Set<string>();

    // Simple matching algorithm - in production, this would be more sophisticated
    for (let i = 0; i < profiles.length; i++) {
      if (usedProfiles.has(profiles[i].id)) continue;

      for (let j = i + 1; j < profiles.length; j++) {
        if (usedProfiles.has(profiles[j].id)) continue;

        // Check if users already have a match for this date
        const existingMatch = await this.findExistingMatch(
          profiles[i].userId,
          profiles[j].userId,
        );

        if (existingMatch) continue;

        // Calculate compatibility score
        const compatibilityScore = await this.calculateCompatibilityScore(
          profiles[i].id,
          profiles[j].id,
        );

        if (compatibilityScore >= this.MIN_COMPATIBILITY_SCORE) {
          const match = this.matchRepository.create({
            user1Id: profiles[i].userId,
            user2Id: profiles[j].userId,
            profile1Id: profiles[i].id,
            profile2Id: profiles[j].id,
            status: MatchStatus.PENDING,
            type: MatchType.DAILY,
            compatibilityScore,
            matchDate,
            expiresAt: this.calculateExpiryTime(),
            isActive: true,
            isMutual: false,
            metadata: {
              matchingAlgorithm: 'daily_v1',
              matchingVersion: '1.0.0',
            },
          });

          const savedMatch = await this.matchRepository.save(match);
          matches.push(savedMatch);
          usedProfiles.add(profiles[i].id);
          usedProfiles.add(profiles[j].id);
          break; // Move to next profile
        }
      }
    }

    return matches.map((match) => this.mapToResponseDto(match));
  }

  private async validateUsersExist(userIds: string[]): Promise<void> {
    const users = await this.userRepository.find({
      where: { id: In(userIds), isActive: true },
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found or inactive');
    }
  }

  private async validateProfilesExist(profileIds: string[]): Promise<void> {
    const profiles = await this.profileRepository.find({
      where: { id: In(profileIds), isActive: true },
    });

    if (profiles.length !== profileIds.length) {
      throw new NotFoundException('One or more profiles not found or inactive');
    }
  }

  private async findExistingMatch(
    user1Id: string,
    user2Id: string,
  ): Promise<Match | null> {
    return this.matchRepository.findOne({
      where: [
        { user1Id, user2Id, isActive: true },
        { user1Id: user2Id, user2Id: user1Id, isActive: true },
      ],
    });
  }

  private async validateDailyMatchLimit(
    user1Id: string,
    user2Id: string,
    matchDate: string,
  ): Promise<void> {
    const date = new Date(matchDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const user1Matches = await this.matchRepository.count({
      where: {
        user1Id,
        matchDate: Between(date, nextDay),
        type: MatchType.DAILY,
        isActive: true,
      },
    });

    const user2Matches = await this.matchRepository.count({
      where: {
        user2Id,
        matchDate: Between(date, nextDay),
        type: MatchType.DAILY,
        isActive: true,
      },
    });

    if (
      user1Matches >= this.MAX_DAILY_MATCHES ||
      user2Matches >= this.MAX_DAILY_MATCHES
    ) {
      throw new ConflictException('Users already have their daily match limit');
    }
  }

  private async calculateCompatibilityScore(
    profile1Id: string,
    profile2Id: string,
  ): Promise<number> {
    const [profile1, profile2] = await this.profileRepository.find({
      where: { id: In([profile1Id, profile2Id]) },
    });

    if (!profile1 || !profile2) {
      throw new NotFoundException('One or both profiles not found');
    }

    let totalScore = 0;

    // Age compatibility (20 points)
    const ageScore = this.calculateAgeCompatibility(
      profile1.age!,
      profile2.age!,
    );
    totalScore += ageScore * this.SCORING_WEIGHTS.ageCompatibility;

    // Location compatibility (15 points)
    const locationScore = this.calculateLocationCompatibility(
      profile1,
      profile2,
    );
    totalScore += locationScore * this.SCORING_WEIGHTS.locationCompatibility;

    // Interest compatibility (25 points)
    const interestScore = this.calculateInterestCompatibility(
      profile1,
      profile2,
    );
    totalScore += interestScore * this.SCORING_WEIGHTS.interestCompatibility;

    // Value compatibility (20 points)
    const valueScore = this.calculateValueCompatibility(profile1, profile2);
    totalScore += valueScore * this.SCORING_WEIGHTS.valueCompatibility;

    // Response rate bonus (10 points)
    const responseRateScore = this.calculateResponseRateBonus(
      profile1,
      profile2,
    );
    totalScore += responseRateScore * this.SCORING_WEIGHTS.responseRateBonus;

    // Activity bonus (5 points)
    const activityScore = this.calculateActivityBonus(profile1, profile2);
    totalScore += activityScore * this.SCORING_WEIGHTS.activityBonus;

    // Verification bonus (5 points)
    const verificationScore = this.calculateVerificationBonus(
      profile1,
      profile2,
    );
    totalScore += verificationScore * this.SCORING_WEIGHTS.verificationBonus;

    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
  }

  private calculateAgeCompatibility(age1: number, age2: number): number {
    const ageDiff = Math.abs(age1 - age2);
    if (ageDiff <= 2) return 100;
    if (ageDiff <= 5) return 80;
    if (ageDiff <= 10) return 60;
    if (ageDiff <= 15) return 40;
    return 20;
  }

  private calculateLocationCompatibility(
    profile1: Profile,
    profile2: Profile,
  ): number {
    if (profile1.city === profile2.city) return 100;
    if (profile1.country === profile2.country) return 70;
    return 30;
  }

  private calculateInterestCompatibility(
    profile1: Profile,
    profile2: Profile,
  ): number {
    const interests1 = profile1.preferences?.interests || [];
    const interests2 = profile2.preferences?.interests || [];

    if (interests1.length === 0 || interests2.length === 0) return 50;

    const commonInterests = interests1.filter((interest) =>
      interests2.includes(interest),
    );
    const totalInterests = Math.max(interests1.length, interests2.length);

    return (commonInterests.length / totalInterests) * 100;
  }

  private calculateValueCompatibility(
    profile1: Profile,
    profile2: Profile,
  ): number {
    const values1 = profile1.preferences?.values || [];
    const values2 = profile2.preferences?.values || [];

    if (values1.length === 0 || values2.length === 0) return 50;

    const commonValues = values1.filter((value) => values2.includes(value));
    const totalValues = Math.max(values1.length, values2.length);

    return (commonValues.length / totalValues) * 100;
  }

  private calculateResponseRateBonus(
    profile1: Profile,
    profile2: Profile,
  ): number {
    // This would be calculated based on actual response rates
    // For now, return a base score
    return 75;
  }

  private calculateActivityBonus(profile1: Profile, profile2: Profile): number {
    // This would be calculated based on recent activity
    // For now, return a base score
    return 80;
  }

  private calculateVerificationBonus(
    profile1: Profile,
    profile2: Profile,
  ): number {
    let score = 0;
    if (profile1.isVerified) score += 50;
    if (profile2.isVerified) score += 50;
    return score;
  }

  private calculateExpiryTime(): Date {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + this.MATCH_EXPIRY_HOURS);
    return expiryTime;
  }

  private mapToResponseDto(match: Match): MatchResponseDto {
    return {
      id: match.id,
      user1Id: match.user1Id,
      user2Id: match.user2Id,
      profile1Id: match.profile1Id,
      profile2Id: match.profile2Id,
      status: match.status,
      type: match.type,
      compatibilityScore: match.compatibilityScore,
      scoringBreakdown: match.scoringBreakdown,
      matchDate: match.matchDate,
      expiresAt: match.expiresAt,
      acceptedAt: match.acceptedAt,
      rejectedAt: match.rejectedAt,
      cancelledAt: match.cancelledAt,
      expiredAt: match.expiredAt,
      isActive: match.isActive,
      isMutual: match.isMutual,
      metadata: match.metadata,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      isExpired: match.isExpired,
      isPending: match.isPending,
      isAccepted: match.isAccepted,
      isRejected: match.isRejected,
      daysSinceMatch: match.daysSinceMatch,
      timeUntilExpiry: match.timeUntilExpiry || undefined,
    };
  }
}
