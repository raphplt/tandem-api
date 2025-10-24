import { Test, TestingModule } from '@nestjs/testing';
import { InterestsService } from './interests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Interest, InterestCategory } from './entities/interest.entity';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestResponseDto } from './dto/interest-response.dto';

describe('InterestsService', () => {
  let service: InterestsService;
  let interestRepository: DeepMockProxy<Repository<Interest>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterestsService,
        {
          provide: getRepositoryToken(Interest),
          useValue: mockDeep<Repository<Interest>>(),
        },
      ],
    }).compile();

    service = module.get<InterestsService>(InterestsService);
    interestRepository = module.get(getRepositoryToken(Interest));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new interest', async () => {
      const createDto: CreateInterestDto = {
        name: 'Photography',
        description: 'Love taking photos',
        category: InterestCategory.ARTS,
        tags: ['art', 'creative'],
      };

      const mockInterest = { id: 'interest-1', ...createDto } as Interest;

      interestRepository.findOne.mockResolvedValue(null);
      interestRepository.create.mockReturnValue(mockInterest);
      interestRepository.save.mockResolvedValue(mockInterest);

      const result = await service.create(createDto);

      expect(interestRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Photography' },
      });
      expect(interestRepository.create).toHaveBeenCalled();
      expect(interestRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when interest already exists', async () => {
      const createDto: CreateInterestDto = {
        name: 'Photography',
        category: InterestCategory.ARTS,
      };

      const existingInterest = {
        id: 'interest-1',
        name: 'Photography',
      } as Interest;

      interestRepository.findOne.mockResolvedValue(existingInterest);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException when name is too long', async () => {
      const createDto: CreateInterestDto = {
        name: 'a'.repeat(51), // Exceeds MAX_NAME_LENGTH
        category: InterestCategory.ARTS,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active interests', async () => {
      const mockInterests = [
        { id: 'interest-1', isActive: true } as Interest,
        { id: 'interest-2', isActive: true } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.findAll();

      expect(interestRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { popularityScore: 'DESC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('should return a specific interest', async () => {
      const mockInterest = { id: 'interest-1' } as Interest;

      interestRepository.findOne.mockResolvedValue(mockInterest);

      const result = await service.findOne('interest-1');

      expect(interestRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'interest-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when interest not found', async () => {
      interestRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCategory', () => {
    it('should return interests by category', async () => {
      const mockInterests = [
        { id: 'interest-1', category: InterestCategory.ARTS } as Interest,
        { id: 'interest-2', category: InterestCategory.ARTS } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.findByCategory(InterestCategory.ARTS);

      expect(interestRepository.find).toHaveBeenCalledWith({
        where: { category: InterestCategory.ARTS, isActive: true },
        order: { popularityScore: 'DESC', name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('searchInterests', () => {
    it('should search interests by query', async () => {
      const mockInterests = [
        { id: 'interest-1', name: 'Photography' } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.searchInterests('photo');

      expect(interestRepository.find).toHaveBeenCalledWith({
        where: [
          { name: Like('%photo%'), isActive: true },
          { description: Like('%photo%'), isActive: true },
        ],
        order: { popularityScore: 'DESC', name: 'ASC' },
        take: 20,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findPopular', () => {
    it('should return popular interests', async () => {
      const mockInterests = [
        { id: 'interest-1', popularityScore: 100 } as Interest,
        { id: 'interest-2', popularityScore: 50 } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.findPopular();

      expect(interestRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { popularityScore: 'DESC' },
        take: 10,
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findTrending', () => {
    it('should return trending interests', async () => {
      const mockInterests = [
        { id: 'interest-1', popularityScore: 150 } as Interest,
        { id: 'interest-2', popularityScore: 50 } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.findTrending();

      expect(result).toHaveLength(1); // Only interest-1 has popularity > 100
    });
  });

  describe('update', () => {
    it('should update an interest', async () => {
      const updateDto: UpdateInterestDto = {
        name: 'Updated Photography',
        description: 'Updated description',
      };

      const existingInterest = {
        id: 'interest-1',
        name: 'Photography',
      } as Interest;
      const updatedInterest = {
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
        profiles: [],
      } as Interest;

      interestRepository.findOne
        .mockResolvedValueOnce(existingInterest) // First call: check if interest exists
        .mockResolvedValueOnce(null) // Second call: check for name conflict
        .mockResolvedValueOnce(updatedInterest); // Third call: get updated interest
      interestRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.update('interest-1', updateDto);

      expect(interestRepository.update).toHaveBeenCalledWith(
        'interest-1',
        updateDto,
      );
      expect(result).toBeDefined();
      expect(result.id).toBe('interest-1');
    });

    it('should throw NotFoundException when interest not found', async () => {
      const updateDto: UpdateInterestDto = { name: 'Updated' };

      interestRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementProfileCount', () => {
    it('should increment profile count and update popularity score', async () => {
      const mockInterest = { id: 'interest-1', profileCount: 5 } as Interest;

      interestRepository.increment.mockResolvedValue({ affected: 1 } as any);
      interestRepository.findOne.mockResolvedValue(mockInterest);
      interestRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.incrementProfileCount('interest-1');

      expect(interestRepository.increment).toHaveBeenCalledWith(
        { id: 'interest-1' },
        'profileCount',
        1,
      );
      expect(interestRepository.update).toHaveBeenCalledWith(
        'interest-1',
        { popularityScore: 10 }, // profileCount * 2
      );
    });
  });

  describe('decrementProfileCount', () => {
    it('should decrement profile count and update popularity score', async () => {
      const mockInterest = { id: 'interest-1', profileCount: 3 } as Interest;

      interestRepository.decrement.mockResolvedValue({ affected: 1 } as any);
      interestRepository.findOne.mockResolvedValue(mockInterest);
      interestRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.decrementProfileCount('interest-1');

      expect(interestRepository.decrement).toHaveBeenCalledWith(
        { id: 'interest-1' },
        'profileCount',
        1,
      );
      expect(interestRepository.update).toHaveBeenCalledWith(
        'interest-1',
        { popularityScore: 6 }, // profileCount * 2 (3 * 2 = 6)
      );
    });
  });

  describe('remove', () => {
    it('should soft delete an interest', async () => {
      const existingInterest = { id: 'interest-1' } as Interest;

      interestRepository.findOne.mockResolvedValue(existingInterest);
      interestRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove('interest-1');

      expect(interestRepository.update).toHaveBeenCalledWith('interest-1', {
        isActive: false,
      });
    });

    it('should throw NotFoundException when interest not found', async () => {
      interestRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete an interest', async () => {
      const existingInterest = { id: 'interest-1' } as Interest;

      interestRepository.findOne.mockResolvedValue(existingInterest);
      interestRepository.remove.mockResolvedValue(existingInterest);

      await service.hardDelete('interest-1');

      expect(interestRepository.remove).toHaveBeenCalledWith(existingInterest);
    });

    it('should throw NotFoundException when interest not found', async () => {
      interestRepository.findOne.mockResolvedValue(null);

      await expect(service.hardDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple interests', async () => {
      const interests = [
        { name: 'Photography', category: InterestCategory.ARTS },
        { name: 'Music', category: InterestCategory.MUSIC },
      ] as CreateInterestDto[];

      interestRepository.findOne.mockResolvedValue(null);
      interestRepository.create.mockReturnValue({} as Interest);
      interestRepository.save.mockResolvedValue({} as Interest);

      const result = await service.bulkCreate(interests);

      expect(result).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return interest statistics', async () => {
      const mockInterests = [
        {
          id: 'interest-1',
          category: InterestCategory.ARTS,
          isActive: true,
          popularityScore: 100,
        } as Interest,
        {
          id: 'interest-2',
          category: InterestCategory.MUSIC,
          isActive: true,
          popularityScore: 50,
        } as Interest,
        {
          id: 'interest-3',
          category: InterestCategory.ARTS,
          isActive: false,
          popularityScore: 30,
        } as Interest,
      ];

      interestRepository.find.mockResolvedValue(mockInterests);

      const result = await service.getStats();

      expect(result).toEqual({
        total: 3,
        active: 2,
        byCategory: {
          [InterestCategory.ARTS]: 2,
          [InterestCategory.MUSIC]: 1,
        },
        mostPopular: [undefined, undefined], // Mock interests don't have names
        averagePopularity: 75,
      });
    });
  });
});
