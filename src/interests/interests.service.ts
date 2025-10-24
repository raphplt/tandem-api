import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Interest, InterestCategory } from './entities/interest.entity';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestResponseDto } from './dto/interest-response.dto';

@Injectable()
export class InterestsService {
  private readonly MAX_NAME_LENGTH = 50;
  private readonly MAX_DESCRIPTION_LENGTH = 500;
  private readonly MAX_TAGS_COUNT = 10;

  constructor(
    @InjectRepository(Interest)
    private interestRepository: Repository<Interest>,
  ) {}

  async create(
    createInterestDto: CreateInterestDto,
  ): Promise<InterestResponseDto> {
    const { name, description, category, icon, color, tags, metadata } =
      createInterestDto;

    // Validate interest data
    this.validateInterestData(createInterestDto);

    // Check for existing interest with same name
    const existingInterest = await this.interestRepository.findOne({
      where: { name },
    });

    if (existingInterest) {
      throw new ConflictException(
        `Interest with name "${name}" already exists`,
      );
    }

    // Create interest
    const interest = this.interestRepository.create({
      name,
      description,
      category,
      icon,
      color,
      tags: tags || [],
      metadata: {
        ...metadata,
        searchWeight: metadata?.searchWeight || 1,
        displayOrder: metadata?.displayOrder || 0,
      },
      isActive: true,
      profileCount: 0,
      popularityScore: 0,
    });

    const savedInterest = await this.interestRepository.save(interest);
    return this.mapToResponseDto(savedInterest);
  }

  async findAll(): Promise<InterestResponseDto[]> {
    const interests = await this.interestRepository.find({
      where: { isActive: true },
      order: { popularityScore: 'DESC', name: 'ASC' },
    });

    return interests.map((interest) => this.mapToResponseDto(interest));
  }

  async findOne(id: string): Promise<InterestResponseDto> {
    const interest = await this.interestRepository.findOne({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundException(`Interest with ID ${id} not found`);
    }

    return this.mapToResponseDto(interest);
  }

  async findByCategory(
    category: InterestCategory,
  ): Promise<InterestResponseDto[]> {
    const interests = await this.interestRepository.find({
      where: { category, isActive: true },
      order: { popularityScore: 'DESC', name: 'ASC' },
    });

    return interests.map((interest) => this.mapToResponseDto(interest));
  }

  async searchInterests(
    query: string,
    limit = 20,
  ): Promise<InterestResponseDto[]> {
    const interests = await this.interestRepository.find({
      where: [
        { name: Like(`%${query}%`), isActive: true },
        { description: Like(`%${query}%`), isActive: true },
      ],
      order: { popularityScore: 'DESC', name: 'ASC' },
      take: limit,
    });

    return interests.map((interest) => this.mapToResponseDto(interest));
  }

  async findPopular(limit = 10): Promise<InterestResponseDto[]> {
    const interests = await this.interestRepository.find({
      where: { isActive: true },
      order: { popularityScore: 'DESC' },
      take: limit,
    });

    return interests.map((interest) => this.mapToResponseDto(interest));
  }

  async findTrending(limit = 10): Promise<InterestResponseDto[]> {
    const interests = await this.interestRepository.find({
      where: { isActive: true },
      order: { popularityScore: 'DESC' },
      take: limit,
    });

    // Filter trending interests (popularity > 100)
    const trendingInterests = interests.filter(
      (interest) => interest.popularityScore > 100,
    );

    return trendingInterests
      .slice(0, limit)
      .map((interest) => this.mapToResponseDto(interest));
  }

  async update(
    id: string,
    updateInterestDto: UpdateInterestDto,
  ): Promise<InterestResponseDto> {
    const interest = await this.interestRepository.findOne({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundException(`Interest with ID ${id} not found`);
    }

    // Validate update data
    if (updateInterestDto.name) {
      this.validateInterestData(updateInterestDto as CreateInterestDto);

      // Check for name conflict
      const existingInterest = await this.interestRepository.findOne({
        where: { name: updateInterestDto.name },
      });

      if (existingInterest && existingInterest.id !== id) {
        throw new ConflictException(
          `Interest with name "${updateInterestDto.name}" already exists`,
        );
      }
    }

    // Update interest
    await this.interestRepository.update(id, updateInterestDto);

    const updatedInterest = await this.interestRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedInterest!);
  }

  async incrementProfileCount(id: string): Promise<void> {
    await this.interestRepository.increment({ id }, 'profileCount', 1);

    // Update popularity score based on profile count
    const interest = await this.interestRepository.findOne({ where: { id } });
    if (interest) {
      const newPopularityScore = Math.min(interest.profileCount * 2, 200);
      await this.interestRepository.update(id, {
        popularityScore: newPopularityScore,
      });
    }
  }

  async decrementProfileCount(id: string): Promise<void> {
    await this.interestRepository.decrement({ id }, 'profileCount', 1);

    // Update popularity score based on profile count
    const interest = await this.interestRepository.findOne({ where: { id } });
    if (interest) {
      const newPopularityScore = Math.max(interest.profileCount * 2, 0);
      await this.interestRepository.update(id, {
        popularityScore: newPopularityScore,
      });
    }
  }

  async remove(id: string): Promise<void> {
    const interest = await this.interestRepository.findOne({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundException(`Interest with ID ${id} not found`);
    }

    // Soft delete by deactivating the interest
    await this.interestRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const interest = await this.interestRepository.findOne({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundException(`Interest with ID ${id} not found`);
    }

    await this.interestRepository.remove(interest);
  }

  async bulkCreate(
    interests: CreateInterestDto[],
  ): Promise<InterestResponseDto[]> {
    const createdInterests: Interest[] = [];

    for (const interestDto of interests) {
      try {
        const interest = await this.create(interestDto);
        createdInterests.push(interest as any);
      } catch (error) {
        if (error instanceof ConflictException) {
          // Skip if already exists
          continue;
        }
        throw error;
      }
    }

    return createdInterests;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<InterestCategory, number>;
    mostPopular: string[];
    averagePopularity: number;
  }> {
    const allInterests = await this.interestRepository.find();
    const activeInterests = allInterests.filter((i) => i.isActive);

    const byCategory = allInterests.reduce(
      (acc, interest) => {
        acc[interest.category] = (acc[interest.category] || 0) + 1;
        return acc;
      },
      {} as Record<InterestCategory, number>,
    );

    const mostPopular = activeInterests
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5)
      .map((i) => i.name);

    const averagePopularity =
      activeInterests.length > 0
        ? activeInterests.reduce((sum, i) => sum + i.popularityScore, 0) /
          activeInterests.length
        : 0;

    return {
      total: allInterests.length,
      active: activeInterests.length,
      byCategory,
      mostPopular,
      averagePopularity: Math.round(averagePopularity),
    };
  }

  private validateInterestData(interestDto: CreateInterestDto): void {
    if (interestDto.name && interestDto.name.length > this.MAX_NAME_LENGTH) {
      throw new BadRequestException(
        `Name must not exceed ${this.MAX_NAME_LENGTH} characters`,
      );
    }

    if (
      interestDto.description &&
      interestDto.description.length > this.MAX_DESCRIPTION_LENGTH
    ) {
      throw new BadRequestException(
        `Description must not exceed ${this.MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    if (interestDto.tags && interestDto.tags.length > this.MAX_TAGS_COUNT) {
      throw new BadRequestException(
        `Tags must not exceed ${this.MAX_TAGS_COUNT} items`,
      );
    }
  }

  private mapToResponseDto(interest: Interest): InterestResponseDto {
    return {
      id: interest.id,
      name: interest.name,
      description: interest.description,
      category: interest.category,
      icon: interest.icon,
      color: interest.color,
      isActive: interest.isActive,
      profileCount: interest.profileCount,
      popularityScore: interest.popularityScore,
      tags: interest.tags,
      metadata: interest.metadata,
      createdAt: interest.createdAt,
      updatedAt: interest.updatedAt,
      isPopular: interest.isPopular,
      isTrending: interest.isTrending,
      displayName: interest.displayName,
      searchableText: interest.searchableText,
    };
  }
}
