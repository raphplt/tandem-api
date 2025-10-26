import { Test, TestingModule } from '@nestjs/testing';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestResponseDto } from './dto/interest-response.dto';
import { InterestCategory } from './entities/interest.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { RolesGuard } from '../auth/roles.guard';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class MockAuthGuard {
    canActivate() {
      return true;
    }
  },
}));

describe('InterestsController', () => {
  let controller: InterestsController;
  let interestsService: DeepMockProxy<InterestsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterestsController],
      providers: [
        {
          provide: InterestsService,
          useValue: mockDeep<InterestsService>(),
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InterestsController>(InterestsController);
    interestsService = module.get(InterestsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new interest', async () => {
      const createDto: CreateInterestDto = {
        name: 'Photography',
        description: 'Love taking photos',
        category: InterestCategory.ARTS,
        tags: ['art', 'creative'],
      };

      const mockResponse: InterestResponseDto = {
        id: 'interest-1',
        name: 'Photography',
        description: 'Love taking photos',
        category: InterestCategory.ARTS,
        tags: ['art', 'creative'],
        isActive: true,
        profileCount: 0,
        popularityScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPopular: false,
        isTrending: false,
        displayName: 'Photography',
        searchableText: 'photography love taking photos art creative',
      };

      interestsService.create.mockResolvedValue(mockResponse);

      const result = await controller.create(createDto);

      expect(interestsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple interests', async () => {
      const interests: CreateInterestDto[] = [
        { name: 'Photography', category: InterestCategory.ARTS },
        { name: 'Music', category: InterestCategory.MUSIC },
      ];

      const mockResponse: InterestResponseDto[] = [
        {
          id: 'interest-1',
          name: 'Photography',
          category: InterestCategory.ARTS,
        } as InterestResponseDto,
        {
          id: 'interest-2',
          name: 'Music',
          category: InterestCategory.MUSIC,
        } as InterestResponseDto,
      ];

      interestsService.bulkCreate.mockResolvedValue(mockResponse);

      const result = await controller.bulkCreate(interests);

      expect(interestsService.bulkCreate).toHaveBeenCalledWith(interests);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findAll', () => {
    it('should return all interests', async () => {
      const mockResponse: InterestResponseDto[] = [
        { id: 'interest-1', name: 'Photography' } as InterestResponseDto,
        { id: 'interest-2', name: 'Music' } as InterestResponseDto,
      ];

      interestsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(interestsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStats', () => {
    it('should return interest statistics', async () => {
      const mockStats = {
        total: 10,
        active: 8,
        byCategory: {
          [InterestCategory.ARTS]: 3,
          [InterestCategory.MUSIC]: 2,
          [InterestCategory.SPORTS]: 0,
          [InterestCategory.TRAVEL]: 0,
          [InterestCategory.FOOD]: 0,
          [InterestCategory.TECHNOLOGY]: 0,
          [InterestCategory.HEALTH]: 0,
          [InterestCategory.EDUCATION]: 0,
          [InterestCategory.BUSINESS]: 0,
          [InterestCategory.ENTERTAINMENT]: 0,
          [InterestCategory.LIFESTYLE]: 0,
          [InterestCategory.OTHER]: 0,
        },
        mostPopular: ['Photography', 'Music'],
        averagePopularity: 75,
      };

      interestsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(interestsService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('findPopular', () => {
    it('should return popular interests', async () => {
      const mockResponse: InterestResponseDto[] = [
        {
          id: 'interest-1',
          name: 'Photography',
          popularityScore: 100,
        } as InterestResponseDto,
      ];

      interestsService.findPopular.mockResolvedValue(mockResponse);

      const result = await controller.findPopular(5);

      expect(interestsService.findPopular).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findTrending', () => {
    it('should return trending interests', async () => {
      const mockResponse: InterestResponseDto[] = [
        {
          id: 'interest-1',
          name: 'Photography',
          popularityScore: 150,
        } as InterestResponseDto,
      ];

      interestsService.findTrending.mockResolvedValue(mockResponse);

      const result = await controller.findTrending(5);

      expect(interestsService.findTrending).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchInterests', () => {
    it('should search interests by query', async () => {
      const mockResponse: InterestResponseDto[] = [
        { id: 'interest-1', name: 'Photography' } as InterestResponseDto,
      ];

      interestsService.searchInterests.mockResolvedValue(mockResponse);

      const result = await controller.searchInterests('photo', 10);

      expect(interestsService.searchInterests).toHaveBeenCalledWith(
        'photo',
        10,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findByCategory', () => {
    it('should return interests by category', async () => {
      const mockResponse: InterestResponseDto[] = [
        {
          id: 'interest-1',
          name: 'Photography',
          category: InterestCategory.ARTS,
        } as InterestResponseDto,
      ];

      interestsService.findByCategory.mockResolvedValue(mockResponse);

      const result = await controller.findByCategory(InterestCategory.ARTS);

      expect(interestsService.findByCategory).toHaveBeenCalledWith(
        InterestCategory.ARTS,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a specific interest', async () => {
      const mockResponse: InterestResponseDto = {
        id: 'interest-1',
        name: 'Photography',
        category: InterestCategory.ARTS,
        isActive: true,
        profileCount: 0,
        popularityScore: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPopular: false,
        isTrending: false,
        displayName: 'Photography',
        searchableText: 'photography',
      };

      interestsService.findOne.mockResolvedValue(mockResponse);

      const result = await controller.findOne('interest-1');

      expect(interestsService.findOne).toHaveBeenCalledWith('interest-1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update an interest', async () => {
      const updateDto: UpdateInterestDto = {
        name: 'Updated Photography',
        description: 'Updated description',
      };

      const mockResponse: InterestResponseDto = {
        id: 'interest-1',
        name: 'Updated Photography',
        description: 'Updated description',
        category: InterestCategory.ARTS,
        isActive: true,
        profileCount: 0,
        popularityScore: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPopular: false,
        isTrending: false,
        displayName: 'Updated Photography',
        searchableText: 'updated photography updated description',
      };

      interestsService.update.mockResolvedValue(mockResponse);

      const result = await controller.update('interest-1', updateDto);

      expect(interestsService.update).toHaveBeenCalledWith(
        'interest-1',
        updateDto,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('remove', () => {
    it('should soft delete an interest', async () => {
      interestsService.remove.mockResolvedValue(undefined);

      await controller.remove('interest-1');

      expect(interestsService.remove).toHaveBeenCalledWith('interest-1');
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete an interest', async () => {
      interestsService.hardDelete.mockResolvedValue(undefined);

      await controller.hardDelete('interest-1');

      expect(interestsService.hardDelete).toHaveBeenCalledWith('interest-1');
    });
  });
});
