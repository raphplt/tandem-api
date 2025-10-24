import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, Gender, ProfileVisibility } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfilesService {
  private readonly MIN_AGE = 18;
  private readonly MAX_AGE = 100;
  private readonly MIN_BIO_LENGTH = 10;
  private readonly MAX_BIO_LENGTH = 500;
  private readonly MAX_DISTANCE = 1000; // km

  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async create(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    // Check if profile already exists for this user
    const existingProfile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    // Validate profile data
    this.validateProfileData(createProfileDto);

    // Create profile
    const profile = this.profileRepository.create({
      userId,
      ...createProfileDto,
      isComplete: this.isProfileComplete(createProfileDto),
    });

    const savedProfile = await this.profileRepository.save(profile);
    return this.mapToResponseDto(savedProfile);
  }

  async findAll(): Promise<ProfileResponseDto[]> {
    const profiles = await this.profileRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    return profiles.map((profile) => this.mapToResponseDto(profile));
  }

  async findOne(id: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    return this.mapToResponseDto(profile);
  }

  async findByUserId(userId: string): Promise<ProfileResponseDto | null> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    return this.mapToResponseDto(profile);
  }

  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
    currentUserId?: string,
  ): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    // Check if user is trying to update someone else's profile
    if (currentUserId && profile.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Validate updated data
    if (updateProfileDto.age !== undefined) {
      this.validateAge(updateProfileDto.age);
    }

    if (updateProfileDto.bio !== undefined) {
      this.validateBio(updateProfileDto.bio);
    }

    if (updateProfileDto.interestedIn !== undefined) {
      this.validateInterestedIn(updateProfileDto.interestedIn);
    }

    if (updateProfileDto.preferences?.maxDistance !== undefined) {
      this.validateMaxDistance(updateProfileDto.preferences.maxDistance);
    }

    // Update profile
    await this.profileRepository.update(id, updateProfileDto);

    const updatedProfile = await this.profileRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedProfile!);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    // Check if user is trying to delete someone else's profile
    if (currentUserId && profile.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    // Soft delete by deactivating the profile
    await this.profileRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    await this.profileRepository.remove(profile);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.profileRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementLikeCount(id: string): Promise<void> {
    await this.profileRepository.increment({ id }, 'likeCount', 1);
  }

  async incrementMatchCount(id: string): Promise<void> {
    await this.profileRepository.increment({ id }, 'matchCount', 1);
  }

  async verifyProfile(id: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    await this.profileRepository.update(id, { isVerified: true });
    const updatedProfile = await this.profileRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedProfile!);
  }

  async searchProfiles(
    query: string,
    gender?: Gender,
    ageRange?: { min: number; max: number },
    city?: string,
    limit = 20,
  ): Promise<ProfileResponseDto[]> {
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.isActive = :isActive', { isActive: true })
      .andWhere('profile.visibility = :visibility', {
        visibility: ProfileVisibility.PUBLIC,
      });

    if (query) {
      queryBuilder.andWhere(
        '(profile.bio ILIKE :query OR profile.city ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    if (gender) {
      queryBuilder.andWhere(':gender = ANY(profile.interestedIn)', { gender });
    }

    if (ageRange) {
      queryBuilder.andWhere('profile.age BETWEEN :minAge AND :maxAge', {
        minAge: ageRange.min,
        maxAge: ageRange.max,
      });
    }

    if (city) {
      queryBuilder.andWhere('profile.city ILIKE :city', { city: `%${city}%` });
    }

    const profiles = await queryBuilder
      .orderBy('profile.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return profiles.map((profile) => this.mapToResponseDto(profile));
  }

  async findNearbyProfiles(
    latitude: number,
    longitude: number,
    maxDistance: number,
    limit = 20,
  ): Promise<ProfileResponseDto[]> {
    // Using PostGIS extension for geographic queries
    // This is a simplified version - in production, you'd use proper PostGIS functions
    const profiles = await this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.isActive = :isActive', { isActive: true })
      .andWhere('profile.visibility = :visibility', {
        visibility: ProfileVisibility.PUBLIC,
      })
      .andWhere('profile.location IS NOT NULL')
      .andWhere(
        `ST_DWithin(
          ST_Point(profile.location->>'longitude', profile.location->>'latitude')::geography,
          ST_Point(:longitude, :latitude)::geography,
          :maxDistance
        )`,
        { latitude, longitude, maxDistance: maxDistance * 1000 }, // Convert km to meters
      )
      .orderBy('profile.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return profiles.map((profile) => this.mapToResponseDto(profile));
  }

  private validateProfileData(profileData: CreateProfileDto): void {
    this.validateAge(profileData.age);
    this.validateBio(profileData.bio);
    this.validateInterestedIn(profileData.interestedIn);

    if (profileData.preferences?.maxDistance) {
      this.validateMaxDistance(profileData.preferences.maxDistance);
    }
  }

  private validateAge(age: number): void {
    if (age < this.MIN_AGE || age > this.MAX_AGE) {
      throw new BadRequestException(
        `Age must be between ${this.MIN_AGE} and ${this.MAX_AGE}`,
      );
    }
  }

  private validateBio(bio: string): void {
    if (bio.length < this.MIN_BIO_LENGTH || bio.length > this.MAX_BIO_LENGTH) {
      throw new BadRequestException(
        `Bio must be between ${this.MIN_BIO_LENGTH} and ${this.MAX_BIO_LENGTH} characters`,
      );
    }
  }

  private validateInterestedIn(interestedIn: Gender[]): void {
    if (!interestedIn || interestedIn.length === 0) {
      throw new BadRequestException(
        'At least one gender preference is required',
      );
    }

    const validGenders = Object.values(Gender);
    for (const gender of interestedIn) {
      if (!validGenders.includes(gender)) {
        throw new BadRequestException(`Invalid gender preference: ${gender}`);
      }
    }
  }

  private validateMaxDistance(maxDistance: number): void {
    if (maxDistance < 1 || maxDistance > this.MAX_DISTANCE) {
      throw new BadRequestException(
        `Max distance must be between 1 and ${this.MAX_DISTANCE} km`,
      );
    }
  }

  private isProfileComplete(profileData: CreateProfileDto): boolean {
    return !!(
      profileData.bio &&
      profileData.city &&
      profileData.age &&
      profileData.gender &&
      profileData.photoUrl &&
      profileData.interestedIn.length > 0
    );
  }

  private mapToResponseDto(profile: Profile): ProfileResponseDto {
    return {
      id: profile.id,
      userId: profile.userId,
      bio: profile.bio || '',
      city: profile.city || '',
      country: profile.country,
      age: profile.age || 0,
      gender: profile.gender || ('prefer_not_to_say' as any),
      interestedIn: profile.interestedIn,
      photoUrl: profile.photoUrl,
      visibility: profile.visibility,
      isActive: profile.isActive,
      isComplete: profile.isComplete,
      isVerified: profile.isVerified,
      preferences: profile.preferences,
      socialLinks: profile.socialLinks,
      location: profile.location,
      viewCount: profile.viewCount,
      likeCount: profile.likeCount,
      matchCount: profile.matchCount,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      isProfileComplete: profile.isProfileComplete,
      ageRange: profile.ageRange,
      maxDistance: profile.maxDistance,
    };
  }
}
