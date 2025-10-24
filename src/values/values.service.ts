import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Value, ValueCategory } from './entities/value.entity';
import { CreateValueDto } from './dto/create-value.dto';
import { UpdateValueDto } from './dto/update-value.dto';
import { ValueResponseDto } from './dto/value-response.dto';

@Injectable()
export class ValuesService {
  private readonly MAX_NAME_LENGTH = 50;
  private readonly MAX_DESCRIPTION_LENGTH = 500;
  private readonly MAX_TAGS_COUNT = 10;

  constructor(
    @InjectRepository(Value)
    private valueRepository: Repository<Value>,
  ) {}

  async create(createValueDto: CreateValueDto): Promise<ValueResponseDto> {
    const { name, description, category, icon, color, tags, metadata } =
      createValueDto;

    // Validate value data
    this.validateValueData(createValueDto);

    // Check for existing value with same name
    const existingValue = await this.valueRepository.findOne({
      where: { name },
    });

    if (existingValue) {
      throw new ConflictException(`Value with name "${name}" already exists`);
    }

    // Create value
    const value = this.valueRepository.create({
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
      importanceScore: 0,
    });

    const savedValue = await this.valueRepository.save(value);
    return this.mapToResponseDto(savedValue);
  }

  async findAll(): Promise<ValueResponseDto[]> {
    const values = await this.valueRepository.find({
      where: { isActive: true },
      order: { importanceScore: 'DESC', name: 'ASC' },
    });

    return values.map((value) => this.mapToResponseDto(value));
  }

  async findOne(id: string): Promise<ValueResponseDto> {
    const value = await this.valueRepository.findOne({
      where: { id },
    });

    if (!value) {
      throw new NotFoundException(`Value with ID ${id} not found`);
    }

    return this.mapToResponseDto(value);
  }

  async findByCategory(category: ValueCategory): Promise<ValueResponseDto[]> {
    const values = await this.valueRepository.find({
      where: { category, isActive: true },
      order: { importanceScore: 'DESC', name: 'ASC' },
    });

    return values.map((value) => this.mapToResponseDto(value));
  }

  async searchValues(query: string, limit = 20): Promise<ValueResponseDto[]> {
    const values = await this.valueRepository.find({
      where: [
        { name: Like(`%${query}%`), isActive: true },
        { description: Like(`%${query}%`), isActive: true },
      ],
      order: { importanceScore: 'DESC', name: 'ASC' },
      take: limit,
    });

    return values.map((value) => this.mapToResponseDto(value));
  }

  async findImportant(limit = 10): Promise<ValueResponseDto[]> {
    const values = await this.valueRepository.find({
      where: { isActive: true },
      order: { importanceScore: 'DESC' },
      take: limit,
    });

    return values.map((value) => this.mapToResponseDto(value));
  }

  async findCore(limit = 10): Promise<ValueResponseDto[]> {
    const values = await this.valueRepository.find({
      where: { isActive: true },
      order: { importanceScore: 'DESC' },
      take: limit,
    });

    // Filter core values (importance > 100)
    const coreValues = values.filter((value) => value.importanceScore > 100);

    return coreValues
      .slice(0, limit)
      .map((value) => this.mapToResponseDto(value));
  }

  async update(
    id: string,
    updateValueDto: UpdateValueDto,
  ): Promise<ValueResponseDto> {
    const value = await this.valueRepository.findOne({
      where: { id },
    });

    if (!value) {
      throw new NotFoundException(`Value with ID ${id} not found`);
    }

    // Validate update data
    if (updateValueDto.name) {
      this.validateValueData(updateValueDto as CreateValueDto);

      // Check for name conflict
      const existingValue = await this.valueRepository.findOne({
        where: { name: updateValueDto.name },
      });

      if (existingValue && existingValue.id !== id) {
        throw new ConflictException(
          `Value with name "${updateValueDto.name}" already exists`,
        );
      }
    }

    // Update value
    await this.valueRepository.update(id, updateValueDto);

    const updatedValue = await this.valueRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedValue!);
  }

  async incrementProfileCount(id: string): Promise<void> {
    await this.valueRepository.increment({ id }, 'profileCount', 1);

    // Update importance score based on profile count
    const value = await this.valueRepository.findOne({ where: { id } });
    if (value) {
      const newImportanceScore = Math.min(value.profileCount * 2, 200);
      await this.valueRepository.update(id, {
        importanceScore: newImportanceScore,
      });
    }
  }

  async decrementProfileCount(id: string): Promise<void> {
    await this.valueRepository.decrement({ id }, 'profileCount', 1);

    // Update importance score based on profile count
    const value = await this.valueRepository.findOne({ where: { id } });
    if (value) {
      const newImportanceScore = Math.max(value.profileCount * 2, 0);
      await this.valueRepository.update(id, {
        importanceScore: newImportanceScore,
      });
    }
  }

  async remove(id: string): Promise<void> {
    const value = await this.valueRepository.findOne({
      where: { id },
    });

    if (!value) {
      throw new NotFoundException(`Value with ID ${id} not found`);
    }

    // Soft delete by deactivating the value
    await this.valueRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const value = await this.valueRepository.findOne({
      where: { id },
    });

    if (!value) {
      throw new NotFoundException(`Value with ID ${id} not found`);
    }

    await this.valueRepository.remove(value);
  }

  async bulkCreate(values: CreateValueDto[]): Promise<ValueResponseDto[]> {
    const createdValues: Value[] = [];

    for (const valueDto of values) {
      try {
        const value = await this.create(valueDto);
        createdValues.push(value as any);
      } catch (error) {
        if (error instanceof ConflictException) {
          // Skip if already exists
          continue;
        }
        throw error;
      }
    }

    return createdValues;
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<ValueCategory, number>;
    mostImportant: string[];
    averageImportance: number;
  }> {
    const allValues = await this.valueRepository.find();
    const activeValues = allValues.filter((v) => v.isActive);

    const byCategory = allValues.reduce(
      (acc, value) => {
        acc[value.category] = (acc[value.category] || 0) + 1;
        return acc;
      },
      {} as Record<ValueCategory, number>,
    );

    const mostImportant = activeValues
      .sort((a, b) => b.importanceScore - a.importanceScore)
      .slice(0, 5)
      .map((v) => v.name);

    const averageImportance =
      activeValues.length > 0
        ? activeValues.reduce((sum, v) => sum + v.importanceScore, 0) /
          activeValues.length
        : 0;

    return {
      total: allValues.length,
      active: activeValues.length,
      byCategory,
      mostImportant,
      averageImportance: Math.round(averageImportance),
    };
  }

  private validateValueData(valueDto: CreateValueDto): void {
    if (valueDto.name && valueDto.name.length > this.MAX_NAME_LENGTH) {
      throw new BadRequestException(
        `Name must not exceed ${this.MAX_NAME_LENGTH} characters`,
      );
    }

    if (
      valueDto.description &&
      valueDto.description.length > this.MAX_DESCRIPTION_LENGTH
    ) {
      throw new BadRequestException(
        `Description must not exceed ${this.MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    if (valueDto.tags && valueDto.tags.length > this.MAX_TAGS_COUNT) {
      throw new BadRequestException(
        `Tags must not exceed ${this.MAX_TAGS_COUNT} items`,
      );
    }
  }

  private mapToResponseDto(value: Value): ValueResponseDto {
    return {
      id: value.id,
      name: value.name,
      description: value.description,
      category: value.category,
      icon: value.icon,
      color: value.color,
      isActive: value.isActive,
      profileCount: value.profileCount,
      importanceScore: value.importanceScore,
      tags: value.tags,
      metadata: value.metadata,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
      isImportant: value.isImportant,
      isCore: value.isCore,
      displayName: value.displayName,
      searchableText: value.searchableText,
    };
  }
}
