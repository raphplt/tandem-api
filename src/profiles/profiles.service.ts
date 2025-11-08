import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { Profile, Gender } from './entities/profile.entity';
import { ProfilePreference } from './entities/profile-preference.entity';
import { User } from '../users/entities/user.entity';
import { Interest } from '../interests/entities/interest.entity';
import { Photo } from '../users/entities/photo.entity';
import { OnboardingService } from '../onboarding/onboarding.service';
import { SaveProfileDraftDto } from './dto/save-profile-draft.dto';
import { SavePreferencesDraftDto } from './dto/save-preferences-draft.dto';
import { SaveInterestsDraftDto } from './dto/save-interests-draft.dto';
import { SavePhotosDraftDto } from './dto/save-photos-draft.dto';
import { UpsertOnboardingDraftResponseDto } from '../onboarding/dto/upsert-onboarding-draft-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { SetPhotosDto } from './dto/set-photos.dto';
import { ProfileResponseDto, ProfilePhotoResponseDto } from './dto/profile-response.dto';

const MIN_ADULT_AGE = 18;

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfilePreference)
    private readonly preferenceRepository: Repository<ProfilePreference>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly onboardingService: OnboardingService,
    private readonly dataSource: DataSource,
  ) {}

  async saveProfileDraft(
    dto: SaveProfileDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    const draft = await this.onboardingService.assertDraftById(
      dto.draftId,
      dto.draftToken,
    );

    const birthdate = new Date(dto.birthdate);
    if (!this.isAdult(birthdate)) {
      throw new BadRequestException('L’utilisateur doit avoir au moins 18 ans');
    }

    const payloadPatch = {
      profile: {
        firstName: dto.firstName.trim(),
        birthdate: birthdate.toISOString().split('T')[0],
        gender: dto.gender,
        seeking: dto.seeking,
        intention: dto.intention ?? null,
        city: dto.city ?? null,
        country: dto.country ?? null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        bio: dto.bio ?? null,
      },
    };

    const { draft: updatedDraft, draftToken } =
      await this.onboardingService.upsertDraft({
        deviceId: draft.deviceId,
        draftToken: dto.draftToken,
        payload: payloadPatch,
      });

    return UpsertOnboardingDraftResponseDto.fromEntity(
      updatedDraft,
      draftToken,
    );
  }

  async savePreferencesDraft(
    dto: SavePreferencesDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    const draft = await this.onboardingService.assertDraftById(
      dto.draftId,
      dto.draftToken,
    );

    if (dto.ageMin > dto.ageMax) {
      throw new BadRequestException('ageMin doit être inférieur à ageMax');
    }

    const payloadPatch = {
      preferences: {
        ageMin: dto.ageMin,
        ageMax: dto.ageMax,
        distanceKm: dto.distanceKm,
      },
    };

    const { draft: updatedDraft, draftToken } =
      await this.onboardingService.upsertDraft({
        deviceId: draft.deviceId,
        draftToken: dto.draftToken,
        payload: payloadPatch,
      });

    return UpsertOnboardingDraftResponseDto.fromEntity(
      updatedDraft,
      draftToken,
    );
  }

  async saveInterestsDraft(
    dto: SaveInterestsDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    const draft = await this.onboardingService.assertDraftById(
      dto.draftId,
      dto.draftToken,
    );

    const interests = await this.interestRepository.find({
      where: { name: In(dto.interestSlugs) },
    });

    if (interests.length !== dto.interestSlugs.length) {
      throw new BadRequestException('Un ou plusieurs intérêts sont invalides');
    }

    const payloadPatch = {
      interests: dto.interestSlugs,
    };

    const { draft: updatedDraft, draftToken } =
      await this.onboardingService.upsertDraft({
        deviceId: draft.deviceId,
        draftToken: dto.draftToken,
        payload: payloadPatch,
      });

    return UpsertOnboardingDraftResponseDto.fromEntity(
      updatedDraft,
      draftToken,
    );
  }

  async savePhotosDraft(
    dto: SavePhotosDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    const draft = await this.onboardingService.assertDraftById(
      dto.draftId,
      dto.draftToken,
    );

    const payloadPatch = {
      photos: dto.photos,
    };

    const { draft: updatedDraft, draftToken } =
      await this.onboardingService.upsertDraft({
        deviceId: draft.deviceId,
        draftToken: dto.draftToken,
        payload: payloadPatch,
      });

    return UpsertOnboardingDraftResponseDto.fromEntity(
      updatedDraft,
      draftToken,
    );
  }

  async getCurrentUserProfile(userId: string): Promise<ProfileResponseDto> {
    const aggregate = await this.loadAggregate(userId);
    return this.mapToResponseDto(aggregate.user);
  }

  async updateCurrentUserProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const aggregate = await this.loadAggregate(userId, manager, {
        ensureProfile: true,
      });

      const { user } = aggregate;
      const profileRepo = manager.getRepository(Profile);
      let profile = user.profile!;

      if (dto.firstName !== undefined) {
        profile.firstName = dto.firstName.trim();
        user.firstName = dto.firstName.trim();
      }

      if (dto.birthdate !== undefined) {
        const birthdate = new Date(dto.birthdate);
        if (!this.isAdult(birthdate)) {
          throw new BadRequestException(
            'L’utilisateur doit avoir au moins 18 ans',
          );
        }
        profile.birthdate = birthdate;
      }

      if (dto.gender !== undefined) {
        profile.gender = dto.gender;
      }

      if (dto.seeking !== undefined) {
        if (!dto.seeking.length) {
          throw new BadRequestException(
            'La liste seeking ne peut pas être vide',
          );
        }
        profile.interestedIn = dto.seeking;
      }

      if (dto.intention !== undefined) {
        profile.intention = dto.intention;
      }

      if (dto.city !== undefined) {
        profile.city = dto.city;
      }

      if (dto.country !== undefined) {
        profile.country = dto.country;
      }

      if (dto.lat !== undefined) {
        profile.lat = dto.lat;
      }

      if (dto.lng !== undefined) {
        profile.lng = dto.lng;
      }

      if (dto.bio !== undefined) {
        profile.bio = dto.bio;
      }

      profile.publishedAt = profile.publishedAt ?? new Date();

      await profileRepo.save(profile);
      await manager.getRepository(User).save(user);

      const refreshed = await this.loadAggregate(userId, manager);
      return this.mapToResponseDto(refreshed.user);
    });
  }

  async updateCurrentUserPreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<ProfileResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const aggregate = await this.loadAggregate(userId, manager, {
        ensureProfile: true,
      });

      let preference = aggregate.user.preference;
      const preferenceRepo = manager.getRepository(ProfilePreference);

      if (!preference) {
        preference = preferenceRepo.create({
          userId,
          ageMin: dto.ageMin ?? 25,
          ageMax: dto.ageMax ?? 35,
          distanceKm: dto.distanceKm ?? 50,
        });
      }

      if (dto.ageMin !== undefined) {
        preference.ageMin = dto.ageMin;
      }

      if (dto.ageMax !== undefined) {
        if (dto.ageMin !== undefined && dto.ageMin > dto.ageMax) {
          throw new BadRequestException('ageMin doit être inférieur à ageMax');
        }
        preference.ageMax = dto.ageMax;
      }

      if (dto.distanceKm !== undefined) {
        preference.distanceKm = dto.distanceKm;
      }

      if (preference.ageMin > preference.ageMax) {
        throw new BadRequestException('ageMin doit être inférieur à ageMax');
      }

      aggregate.user.preference = await preferenceRepo.save(preference);

      const refreshed = await this.loadAggregate(userId, manager);
      return this.mapToResponseDto(refreshed.user);
    });
  }

  async setUserPhotos(
    userId: string,
    dto: SetPhotosDto,
  ): Promise<ProfilePhotoResponseDto[]> {
    if (!dto.photos.length) {
      throw new BadRequestException('Au moins une photo est requise');
    }

    return this.dataSource.transaction(async (manager) => {
      const aggregate = await this.loadAggregate(userId, manager, {
        ensureProfile: true,
      });

      const photoRepo = manager.getRepository(Photo);
      const profileRepo = manager.getRepository(Profile);
      await photoRepo.delete({ userId });

      const photos = dto.photos.map((url, index) =>
        photoRepo.create({
          userId,
          url,
          position: index + 1,
          isActive: true,
        }),
      );

      await photoRepo.save(photos);

      aggregate.user.photos = photos;
      const profile = aggregate.user.profile!;
      profile.photoUrl = photos[0]?.url;
      profile.photoPublicId = undefined;
      await profileRepo.save(profile);

      return photos
        .sort((a, b) => a.position - b.position)
        .map((photo) => ({ url: photo.url, position: photo.position }));
    });
  }

  private isAdult(birthdate: Date): boolean {
    const now = new Date();
    const age =
      now.getFullYear() -
      birthdate.getFullYear() -
      (now <
      new Date(
        birthdate.getFullYear() + now.getFullYear() - birthdate.getFullYear(),
        birthdate.getMonth(),
        birthdate.getDate(),
      )
        ? 1
        : 0);
    return age >= MIN_ADULT_AGE;
  }

  private async loadAggregate(
    userId: string,
    manager?: EntityManager,
    options?: { ensureProfile?: boolean },
  ): Promise<{ user: User }> {
    const repo = manager?.getRepository(User) ?? this.userRepository;
    const user = await repo.findOne({
      where: { id: userId },
      relations: [
        'profile',
        'profile.interests',
        'profile.values',
        'preference',
        'photos',
      ],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.profile) {
      const profileRepo =
        manager?.getRepository(Profile) ?? this.profileRepository;

      const existingProfile = await profileRepo.findOne({
        where: { userId },
        relations: ['interests', 'values'],
      });

      if (existingProfile) {
        user.profile = existingProfile;
      } else if (options?.ensureProfile) {
        const profile = profileRepo.create({
          userId,
          firstName: user.firstName ?? '',
          birthdate: user.dateOfBirth ?? new Date('1990-01-01'),
          gender: Gender.PREFER_NOT_TO_SAY,
          interestedIn: [Gender.PREFER_NOT_TO_SAY],
          isActive: true,
        });
        user.profile = await profileRepo.save(profile);
      } else {
        throw new NotFoundException('Profil introuvable');
      }
    }

    return { user };
  }

  private mapToResponseDto(user: User): ProfileResponseDto {
    const profile = user.profile!;
    const preference = user.preference;
    const photos = (user.photos ?? []).sort((a, b) => a.position - b.position);
    const profileInterests = profile.interests ?? [];
    const jsonPreferences = profile.preferences;

    const ageMin = preference?.ageMin ?? jsonPreferences?.ageRange?.min ?? 25;
    const ageMax = preference?.ageMax ?? jsonPreferences?.ageRange?.max ?? 35;
    const distanceKm =
      preference?.distanceKm ?? jsonPreferences?.maxDistance ?? 50;

    const birthdateValue = profile.birthdate
      ? new Date(profile.birthdate)
      : undefined;
    const birthdate =
      birthdateValue && !Number.isNaN(birthdateValue.getTime())
        ? birthdateValue.toISOString().split('T')[0]
        : undefined;

    return {
      userId: user.id,
      firstName: profile.firstName ?? undefined,
      birthdate,
      gender: profile.gender ?? undefined,
      seeking: profile.interestedIn ?? [],
      intention: profile.intention ?? undefined,
      city: profile.city ?? undefined,
      country: profile.country ?? undefined,
      lat: profile.lat ?? undefined,
      lng: profile.lng ?? undefined,
      bio: profile.bio ?? undefined,
      publishedAt: profile.publishedAt ?? undefined,
      photoUrl: profile.photoUrl ?? undefined,
      preferences: {
        ageMin,
        ageMax,
        distanceKm,
      },
      interests: profileInterests.map((interest) => interest.name),
      photos: photos.map((photo) => ({
        url: photo.url,
        position: photo.position,
      })),
    };
  }
}
