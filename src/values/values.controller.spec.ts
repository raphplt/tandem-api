import { Test, TestingModule } from '@nestjs/testing';
import { ValuesController } from './values.controller';
import { ValuesService } from './values.service';
import { CreateValueDto } from './dto/create-value.dto';
import { UpdateValueDto } from './dto/update-value.dto';
import { ValueResponseDto } from './dto/value-response.dto';
import { ValueCategory } from './entities/value.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('ValuesController', () => {
  let controller: ValuesController;
  let valuesService: DeepMockProxy<ValuesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesController],
      providers: [
        {
          provide: ValuesService,
          useValue: mockDeep<ValuesService>(),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ValuesController>(ValuesController);
    valuesService = module.get(ValuesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new value', async () => {
      const createDto: CreateValueDto = {
        name: 'Honesty',
        description: 'Being truthful and transparent',
        category: ValueCategory.PERSONAL,
        tags: ['integrity', 'trust'],
      };

      const mockResponse: ValueResponseDto = {
        id: 'value-1',
        name: 'Honesty',
        description: 'Being truthful and transparent',
        category: ValueCategory.PERSONAL,
        tags: ['integrity', 'trust'],
        isActive: true,
        profileCount: 0,
        importanceScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImportant: false,
        isCore: false,
        displayName: 'Honesty',
        searchableText: 'honesty being truthful and transparent integrity trust',
      };

      valuesService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(valuesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple values', async () => {
      const values: CreateValueDto[] = [
        { name: 'Honesty', category: ValueCategory.PERSONAL },
        { name: 'Loyalty', category: ValueCategory.PERSONAL },
      ];

      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty', category: ValueCategory.PERSONAL } as ValueResponseDto,
        { id: 'value-2', name: 'Loyalty', category: ValueCategory.PERSONAL } as ValueResponseDto,
      ];

      valuesService.bulkCreate.mockResolvedValue(mockResponse);

      const result = await controller.bulkCreate(values);

      expect(valuesService.bulkCreate).toHaveBeenCalledWith(values);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    it('should return all values', async () => {
      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty' } as ValueResponseDto,
        { id: 'value-2', name: 'Loyalty' } as ValueResponseDto,
      ];

      valuesService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(valuesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should return value statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        byCategory: {
          [ValueCategory.PERSONAL]: 3,
          [ValueCategory.SOCIAL]: 2,
          [ValueCategory.PROFESSIONAL]: 0,
          [ValueCategory.SPIRITUAL]: 0,
          [ValueCategory.FAMILY]: 0,
          [ValueCategory.HEALTH]: 0,
          [ValueCategory.EDUCATION]: 0,
          [ValueCategory.ENVIRONMENT]: 0,
          [ValueCategory.POLITICS]: 0,
          [ValueCategory.CULTURE]: 0,
          [ValueCategory.OTHER]: 0,
        },
        mostImportant: ['Honesty', 'Loyalty'],
        averageImportance: 75,
      };

      valuesService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(valuesService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findImportant', () => {
    it('should return important values', async () => {
      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty', importanceScore: 100 } as ValueResponseDto,
      ];

      valuesService.findImportant.mockResolvedValue(mockResponse);

      const result = await controller.findImportant(5);

      expect(valuesService.findImportant).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findCore', () => {
    it('should return core values', async () => {
      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty', importanceScore: 150 } as ValueResponseDto,
      ];

      valuesService.findCore.mockResolvedValue(mockResponse);

      const result = await controller.findCore(5);

      expect(valuesService.findCore).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchValues', () => {
    it('should search values by query', async () => {
      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty' } as ValueResponseDto,
      ];

      valuesService.searchValues.mockResolvedValue(mockResponse);

      const result = await controller.searchValues('honest', 10);

      expect(valuesService.searchValues).toHaveBeenCalledWith('honest', 10);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByCategory', () => {
    it('should return values by category', async () => {
      const mockResponse: ValueResponseDto[] = [
        { id: 'value-1', name: 'Honesty', category: ValueCategory.PERSONAL } as ValueResponseDto,
      ];

      valuesService.findByCategory.mockResolvedValue(mockResponse);

      const result = await controller.findByCategory(ValueCategory.PERSONAL);

      expect(valuesService.findByCategory).toHaveBeenCalledWith(ValueCategory.PERSONAL);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a specific value', async () => {
      const mockResponse: ValueResponseDto = {
        id: 'value-1',
        name: 'Honesty',
        category: ValueCategory.PERSONAL,
        isActive: true,
        profileCount: 0,
        importanceScore: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isImportant: false,
        isCore: false,
        displayName: 'Honesty',
        searchableText: 'honesty',
      };

      valuesService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne('value-1');

      expect(valuesService.findOne).toHaveBeenCalledWith('value-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update a value', async () => {
      const updateDto: UpdateValueDto = {
        name: 'Updated Honesty',
        description: 'Updated description',
      };

      const mockResponse: ValueResponseDto = {
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
      };

      valuesService.update.mockResolvedValue(mockResponse);

      const result = await controller.update('value-1', updateDto);

      expect(valuesService.update).toHaveBeenCalledWith('value-1', updateDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    it('should soft delete a value', async () => {
      valuesService.remove.mockResolvedValue(undefined);

      await controller.remove('value-1');

      expect(valuesService.remove).toHaveBeenCalledWith('value-1');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a value', async () => {
      valuesService.hardDelete.mockResolvedValue(undefined);

      await controller.hardDelete('value-1');

      expect(valuesService.hardDelete).toHaveBeenCalledWith('value-1');
    });
  });
});
