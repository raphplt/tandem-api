import { Test, TestingModule } from '@nestjs/testing';
import { ValuesService } from './values.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Value, ValueCategory } from './entities/value.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateValueDto } from './dto/create-value.dto';
import { UpdateValueDto } from './dto/update-value.dto';
import { ValueResponseDto } from './dto/value-response.dto';

describe('ValuesService', () => {
  let service: ValuesService;
  let valueRepository: DeepMockProxy<Repository<Value>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValuesService,
        {
          provide: getRepositoryToken(Value),
          useValue: mockDeep<Repository<Value>>(),
        },
      ],
    }).compile();

    service = module.get<ValuesService>(ValuesService);
    valueRepository = module.get(getRepositoryToken(Value));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new value', async () => {
      const createDto: CreateValueDto = {
        name: 'Honesty',
        description: 'Being truthful and transparent',
        category: ValueCategory.PERSONAL,
        tags: ['integrity', 'trust'],
      };

      const mockValue = { id: 'value-1', ...createDto } as Value;

      valueRepository.findOne.mockResolvedValue(null);
      valueRepository.create.mockReturnValue(mockValue);
      valueRepository.save.mockResolvedValue(mockValue);

      const result = await service.create(createDto);

      expect(valueRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Honesty' },
      });
      expect(valueRepository.create).toHaveBeenCalled();
      expect(valueRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when value already exists', async () => {
      const createDto: CreateValueDto = {
        name: 'Honesty',
        category: ValueCategory.PERSONAL,
      };

      const existingValue = { id: 'value-1', name: 'Honesty' } as Value;

      valueRepository.findOne.mockResolvedValue(existingValue);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when name is too long', async () => {
      const createDto: CreateValueDto = {
        name: 'a'.repeat(51), // Exceeds MAX_NAME_LENGTH
        category: ValueCategory.PERSONAL,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active values', async () => {
      const mockValues = [
        { id: 'value-1', isActive: true } as Value,
        { id: 'value-2', isActive: true } as Value,
      ];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.findAll();

      expect(valueRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { importanceScore: 'DESC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a specific value', async () => {
      const mockValue = { id: 'value-1' } as Value;

      valueRepository.findOne.mockResolvedValue(mockValue);

      const result = await service.findOne('value-1');

      expect(valueRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'value-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when value not found', async () => {
      valueRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCategory', () => {
    it('should return values by category', async () => {
      const mockValues = [
        { id: 'value-1', category: ValueCategory.PERSONAL } as Value,
        { id: 'value-2', category: ValueCategory.PERSONAL } as Value,
      ];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.findByCategory(ValueCategory.PERSONAL);

      expect(valueRepository.find).toHaveBeenCalledWith({
        where: { category: ValueCategory.PERSONAL, isActive: true },
        order: { importanceScore: 'DESC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('searchValues', () => {
    it('should search values by query', async () => {
      const mockValues = [{ id: 'value-1', name: 'Honesty' } as Value];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.searchValues('honest');

      expect(valueRepository.find).toHaveBeenCalledWith({
        where: [
          { name: Like('%honest%'), isActive: true },
          { description: Like('%honest%'), isActive: true },
        ],
        order: { importanceScore: 'DESC', name: 'ASC' },
        take: 20,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findImportant', () => {
    it('should return important values', async () => {
      const mockValues = [
        { id: 'value-1', importanceScore: 100 } as Value,
        { id: 'value-2', importanceScore: 50 } as Value,
      ];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.findImportant();

      expect(valueRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { importanceScore: 'DESC' },
        take: 10,
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findCore', () => {
    it('should return core values', async () => {
      const mockValues = [
        { id: 'value-1', importanceScore: 150 } as Value,
        { id: 'value-2', importanceScore: 50 } as Value,
      ];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.findCore();

      expect(result).toHaveLength(1); // Only value-1 has importance > 100
    });
  });

  describe('update', () => {
    it('should update a value', async () => {
      const updateDto: UpdateValueDto = {
        name: 'Updated Honesty',
        description: 'Updated description',
      };

      const existingValue = { id: 'value-1', name: 'Honesty' } as Value;
      const updatedValue = {
        id: 'value-1',
        name: 'Updated Honesty',
        description: 'Updated description',
        category: ValueCategory.PERSONAL,
        isActive: true,
        profileCount: 0,
        importanceScore: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isImportant: false,
        isCore: false,
        displayName: 'Updated Honesty',
        searchableText: 'updated honesty updated description',
        profiles: [],
      } as Value;

      valueRepository.findOne
        .mockResolvedValueOnce(existingValue) // First call: check if value exists
        .mockResolvedValueOnce(null) // Second call: check for name conflict
        .mockResolvedValueOnce(updatedValue); // Third call: get updated value
      valueRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update('value-1', updateDto);

      expect(valueRepository.update).toHaveBeenCalledWith('value-1', updateDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('value-1');
    });

    it('should throw NotFoundException when value not found', async () => {
      const updateDto: UpdateValueDto = { name: 'Updated' };

      valueRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementProfileCount', () => {
    it('should increment profile count and update importance score', async () => {
      const mockValue = { id: 'value-1', profileCount: 5 } as Value;

      valueRepository.increment.mockResolvedValue({ affected: 1 } as any);
      valueRepository.findOne.mockResolvedValue(mockValue);
      valueRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.incrementProfileCount('value-1');

      expect(valueRepository.increment).toHaveBeenCalledWith(
        { id: 'value-1' },
        'profileCount',
        1,
      );
      expect(valueRepository.update).toHaveBeenCalledWith(
        'value-1',
        { importanceScore: 10 }, // profileCount * 2
      );
    });
  });

  describe('decrementProfileCount', () => {
    it('should decrement profile count and update importance score', async () => {
      const mockValue = { id: 'value-1', profileCount: 3 } as Value;

      valueRepository.decrement.mockResolvedValue({ affected: 1 } as any);
      valueRepository.findOne.mockResolvedValue(mockValue);
      valueRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.decrementProfileCount('value-1');

      expect(valueRepository.decrement).toHaveBeenCalledWith(
        { id: 'value-1' },
        'profileCount',
        1,
      );
      expect(valueRepository.update).toHaveBeenCalledWith(
        'value-1',
        { importanceScore: 6 }, // profileCount * 2 (3 * 2 = 6)
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a value', async () => {
      const existingValue = { id: 'value-1' } as Value;

      valueRepository.findOne.mockResolvedValue(existingValue);
      valueRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove('value-1');

      expect(valueRepository.update).toHaveBeenCalledWith('value-1', {
        isActive: false,
      });
    });

    it('should throw NotFoundException when value not found', async () => {
      valueRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a value', async () => {
      const existingValue = { id: 'value-1' } as Value;

      valueRepository.findOne.mockResolvedValue(existingValue);
      valueRepository.remove.mockResolvedValue(existingValue);

      await service.hardDelete('value-1');

      expect(valueRepository.remove).toHaveBeenCalledWith(existingValue);
    });

    it('should throw NotFoundException when value not found', async () => {
      valueRepository.findOne.mockResolvedValue(null);

      await expect(service.hardDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple values', async () => {
      const values = [
        { name: 'Honesty', category: ValueCategory.PERSONAL },
        { name: 'Loyalty', category: ValueCategory.PERSONAL },
      ] as CreateValueDto[];

      valueRepository.findOne.mockResolvedValue(null);
      valueRepository.create.mockReturnValue({} as Value);
      valueRepository.save.mockResolvedValue({} as Value);

      const result = await service.bulkCreate(values);

      expect(result).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return value statistics', async () => {
      const mockValues = [
        {
          id: 'value-1',
          category: ValueCategory.PERSONAL,
          isActive: true,
          importanceScore: 100,
        } as Value,
        {
          id: 'value-2',
          category: ValueCategory.SOCIAL,
          isActive: true,
          importanceScore: 50,
        } as Value,
        {
          id: 'value-3',
          category: ValueCategory.PERSONAL,
          isActive: false,
          importanceScore: 30,
        } as Value,
      ];

      valueRepository.find.mockResolvedValue(mockValues);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 3,
        active: 2,
        byCategory: {
          [ValueCategory.PERSONAL]: 2,
          [ValueCategory.SOCIAL]: 1,
        },
        mostImportant: [undefined, undefined], // Mock values don't have names
        averageImportance: 75,
      });
    });
  });
});
