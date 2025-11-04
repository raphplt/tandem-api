import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { OnboardingService } from './onboarding.service';
import { OnboardingDraft } from './entities/onboarding-draft.entity';
import { User } from '../users/entities/user.entity';
import {
  UserAuthMethod,
  AuthMethodType,
} from '../users/entities/user-auth-method.entity';
import { Profile, Gender } from '../profiles/entities/profile.entity';
import { ProfilePreference } from '../profiles/entities/profile-preference.entity';
import { Photo } from '../users/entities/photo.entity';
import { Interest } from '../interests/entities/interest.entity';
import { AuditLog } from '../users/entities/audit-log.entity';

interface MergeDraftParams {
  draftId: string;
  draftToken: string;
  authMethod: AuthMethodType;
  identifier: string;
  email?: string;
  phone?: string;
  appleSub?: string;
  googleSub?: string;
  existingUserId?: string;
}

type DraftPayload = {
  profile?: {
    firstName: string;
    birthdate: string;
    gender: Gender;
    seeking: Gender[];
    intention?: string | null;
    city?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
    bio?: string | null;
  };
  preferences?: {
    ageMin: number;
    ageMax: number;
    distanceKm: number;
  };
  interests?: string[];
  photos?: string[];
};

@Injectable()
export class OnboardingMergeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly onboardingService: OnboardingService,
    @InjectRepository(OnboardingDraft)
    private readonly onboardingDraftRepository: Repository<OnboardingDraft>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuthMethod)
    private readonly authMethodRepository: Repository<UserAuthMethod>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfilePreference)
    private readonly preferenceRepository: Repository<ProfilePreference>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async mergeDraft(params: MergeDraftParams): Promise<User> {
    const draft = await this.onboardingService.assertDraftById(
      params.draftId,
      params.draftToken,
    );

    const payload = (draft.payloadJson ?? {}) as DraftPayload;
    if (!payload.profile) {
      throw new BadRequestException(
        'Le draft ne contient pas de profil valide',
      );
    }

    const birthdate = new Date(payload.profile.birthdate);
    if (Number.isNaN(birthdate.getTime())) {
      throw new BadRequestException('Date de naissance invalide');
    }

    if (!this.isAdult(birthdate)) {
      throw new BadRequestException('L’utilisateur doit avoir au moins 18 ans');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const authRepo = manager.getRepository(UserAuthMethod);
      const profileRepo = manager.getRepository(Profile);
      const preferenceRepo = manager.getRepository(ProfilePreference);
      const photoRepo = manager.getRepository(Photo);
      const interestRepo = manager.getRepository(Interest);
      const auditRepo = manager.getRepository(AuditLog);
      const profilePayload = payload.profile!;

      let user = params.existingUserId
        ? await userRepo.findOne({ where: { id: params.existingUserId } })
        : await this.findExistingUser(manager, params);

      if (!user) {
        user = userRepo.create({
          email: params.email,
          phone: params.phone,
          appleSub: params.appleSub,
          googleSub: params.googleSub,
          isActive: true,
        });
      } else {
        if (params.email) {
          user.email = params.email;
        }
        if (params.phone) {
          user.phone = params.phone;
        }
        if (params.appleSub) {
          user.appleSub = params.appleSub;
        }
        if (params.googleSub) {
          user.googleSub = params.googleSub;
        }
      }

      user.onboardedAt = user.onboardedAt ?? new Date();
      user.firstName = profilePayload.firstName;
      user.dateOfBirth = birthdate;

      user = await userRepo.save(user);

      await this.upsertAuthMethod(authRepo, user, params);

      let profile = await profileRepo.findOne({ where: { userId: user.id } });
      if (!profile) {
        profile = profileRepo.create({ userId: user.id, isActive: true });
      }

      profile.firstName = profilePayload.firstName;
      profile.birthdate = birthdate;
      profile.gender = profilePayload.gender;
      profile.interestedIn = profilePayload.seeking ?? [];
      profile.intention = profilePayload.intention ?? undefined;
      profile.city = profilePayload.city ?? undefined;
      profile.country = profilePayload.country ?? undefined;
      profile.lat = profilePayload.lat ?? undefined;
      profile.lng = profilePayload.lng ?? undefined;
      profile.bio = profilePayload.bio ?? undefined;
      profile.age = this.computeAge(birthdate);
      if (payload.photos?.length) {
        profile.photoUrl = payload.photos[0];
      }
      profile.publishedAt = profile.publishedAt ?? new Date();

      profile = await profileRepo.save(profile);

      // Rattache explicitement le profil à l'utilisateur afin d'alimenter users.profileId
      if (!user.profile || user.profile.id !== profile.id) {
        user.profile = profile;
        user.profileId = profile.id;
        await userRepo.save(user);
      }

      if (payload.preferences) {
        let preference = await preferenceRepo.findOne({
          where: { userId: user.id },
        });

        if (!preference) {
          preference = preferenceRepo.create({ userId: user.id });
        }

        preference.ageMin = payload.preferences.ageMin;
        preference.ageMax = payload.preferences.ageMax;
        preference.distanceKm = payload.preferences.distanceKm;

        await preferenceRepo.save(preference);
        profile.preferences = {
          ageRange: {
            min: payload.preferences.ageMin,
            max: payload.preferences.ageMax,
          },
          maxDistance: payload.preferences.distanceKm,
          interests: payload.interests ?? [],
        };
        await profileRepo.save(profile);
      }

      //TODO : corriger ce bidouillage
      if (payload.interests && payload.interests.length) {
        try {
          const uniqueInterestKeys = [...new Set(payload.interests)];
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

          const idKeys = uniqueInterestKeys.filter((key) =>
            uuidRegex.test(key),
          );
          const nameKeys = uniqueInterestKeys.filter(
            (key) => !uuidRegex.test(key),
          );

          const interestsById = idKeys.length
            ? await interestRepo.find({ where: { id: In(idKeys) } })
            : [];
          const remainingIds = new Set(idKeys);
          interestsById.forEach((interest) => remainingIds.delete(interest.id));

          const interestsByName = nameKeys.length
            ? await interestRepo.find({ where: { name: In(nameKeys) } })
            : [];
          const remainingNames = new Set(nameKeys);
          interestsByName.forEach((interest) =>
            remainingNames.delete(interest.name),
          );

          if (remainingIds.size > 0 || remainingNames.size > 0) {
            const missing = [
              ...Array.from(remainingIds.values()),
              ...Array.from(remainingNames.values()),
            ];
            console.warn(
              '[OnboardingMerge] Intérêts inconnus ignorés:',
              missing.join(', '),
            );
          }

          const interests = [...interestsById, ...interestsByName];

          if (interests.length > 0) {
            const profileWithInterests = await profileRepo.findOne({
              where: { id: profile.id },
              relations: ['interests'],
            });

            const existingInterestIds =
              profileWithInterests?.interests?.map(
                (interest) => interest.id,
              ) ?? [];
            const desiredInterestIds = interests.map((interest) => interest.id);

            const relationBuilder = manager
              .createQueryBuilder()
              .relation(Profile, 'interests')
              .of(profile.id);

            const idsToRemove = existingInterestIds.filter(
              (id) => !desiredInterestIds.includes(id),
            );
            const idsToAdd = desiredInterestIds.filter(
              (id) => !existingInterestIds.includes(id),
            );

            if (idsToRemove.length > 0) {
              await relationBuilder.remove(idsToRemove);
            }

            if (idsToAdd.length > 0) {
              await relationBuilder.add(idsToAdd);
            }
          }
        } catch (error) {
          console.error(
            '[OnboardingMerge] Impossible de lier les intérêts, draft ignoré',
            error,
          );
        }
      }

      if (payload.photos?.length) {
        await photoRepo.delete({ userId: user.id });
        const photos = payload.photos.slice(0, 3).map((url, index) =>
          photoRepo.create({
            userId: user.id,
            url,
            position: index + 1,
            isActive: true,
          }),
        );
        await photoRepo.save(photos);
      }

      await auditRepo.save(
        auditRepo.create({
          actorUserId: user.id,
          action: 'onboarding.merge',
          metaJson: { draftId: draft.id, authMethod: params.authMethod },
        }),
      );

      await this.onboardingDraftRepository.delete(draft.id);

      return user;
    });
  }

  private async findExistingUser(
    manager: EntityManager,
    params: MergeDraftParams,
  ): Promise<User | null> {
    const repo = manager.getRepository(User);

    if (params.existingUserId) {
      return repo.findOne({ where: { id: params.existingUserId } });
    }

    if (params.email) {
      const byEmail = await repo.findOne({ where: { email: params.email } });
      if (byEmail) {
        return byEmail;
      }
    }

    if (params.phone) {
      const byPhone = await repo.findOne({ where: { phone: params.phone } });
      if (byPhone) {
        return byPhone;
      }
    }

    if (params.appleSub) {
      const byApple = await repo.findOne({
        where: { appleSub: params.appleSub },
      });
      if (byApple) {
        return byApple;
      }
    }

    if (params.googleSub) {
      const byGoogle = await repo.findOne({
        where: { googleSub: params.googleSub },
      });
      if (byGoogle) {
        return byGoogle;
      }
    }

    const authRepo = manager.getRepository(UserAuthMethod);
    const authMethod = await authRepo.findOne({
      where: {
        type: params.authMethod,
        identifier: params.identifier,
      },
      relations: ['user'],
    });

    return authMethod?.user ?? null;
  }

  private async upsertAuthMethod(
    repo: Repository<UserAuthMethod>,
    user: User,
    params: MergeDraftParams,
  ): Promise<void> {
    const existing = await repo.findOne({
      where: {
        userId: user.id,
        type: params.authMethod,
        identifier: params.identifier,
      },
    });

    if (existing) {
      existing.lastUsedAt = new Date();
      await repo.save(existing);
      return;
    }

    await repo.save(
      repo.create({
        userId: user.id,
        type: params.authMethod,
        identifier: params.identifier,
        isPrimary: true,
        lastUsedAt: new Date(),
      }),
    );
  }

  private isAdult(birthdate: Date): boolean {
    const now = new Date();
    const age =
      now.getFullYear() -
      birthdate.getFullYear() -
      (now <
      new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate())
        ? 1
        : 0);
    return age >= 18;
  }

  private computeAge(birthdate: Date): number | undefined {
    if (!birthdate) {
      return undefined;
    }
    const now = new Date();
    let age = now.getFullYear() - birthdate.getFullYear();
    const m = now.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }
}
