import { DataSource, In } from 'typeorm';
import { TEST_ACCOUNT_FIXTURES } from '../../test-accounts/test-accounts.fixtures';
import { BetterAuthUser } from '../../auth/entities/better-auth-user.entity';
import { BetterAuthAccount } from '../../auth/entities/better-auth-account.entity';
import { User } from '../../users/entities/user.entity';
import { Profile, ProfileVisibility } from '../../profiles/entities/profile.entity';
import { ProfilePreference } from '../../profiles/entities/profile-preference.entity';
import { Photo } from '../../users/entities/photo.entity';
import { UserAuthMethod, AuthMethodType } from '../../users/entities/user-auth-method.entity';
import { Interest } from '../../interests/entities/interest.entity';
import { UserRole } from '../../common/enums/user.enums';

function isFeatureEnabled(): boolean {
  const raw = (process.env.FEATURE_TEST_ACCOUNTS ?? '').toString().trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export async function seedTestAccounts(dataSource: DataSource): Promise<void> {
  if (!isFeatureEnabled()) {
    console.log('⏭️  Skipping test account seeding (FEATURE_TEST_ACCOUNTS disabled)');
    return;
  }

  console.log('\n🌱 Seeding synthetic test accounts...');

  const betterAuthUserRepository = dataSource.getRepository(BetterAuthUser);
  const betterAuthAccountRepository = dataSource.getRepository(BetterAuthAccount);
  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(Profile);
  const preferenceRepository = dataSource.getRepository(ProfilePreference);
  const photoRepository = dataSource.getRepository(Photo);
  const authMethodRepository = dataSource.getRepository(UserAuthMethod);
  const interestRepository = dataSource.getRepository(Interest);

  let created = 0;
  let skipped = 0;

  for (const fixture of TEST_ACCOUNT_FIXTURES) {
    const existingUser = await userRepository.findOne({
      where: { id: fixture.userId },
    });

    if (existingUser) {
      skipped++;
      console.log(`   ⏭️  ${fixture.slug} already exists, skipping`);
      continue;
    }

    const now = new Date();
    const birthdate = new Date(fixture.birthdate);

    const betterAuthUser = betterAuthUserRepository.create({
      id: fixture.userId,
      email: fixture.email,
      name: `${fixture.firstName} ${fixture.lastName}`.trim(),
      image: fixture.photos[0],
      emailVerified: true,
    });
    await betterAuthUserRepository.save(betterAuthUser);

    const user = userRepository.create({
      id: fixture.userId,
      email: fixture.email,
      firstName: fixture.firstName,
      lastName: fixture.lastName,
      dateOfBirth: birthdate,
      roles: [UserRole.USER],
      isActive: true,
      onboardedAt: now,
    });
    await userRepository.save(user);

    const account = betterAuthAccountRepository.create({
      id: fixture.betterAuthAccountId,
      userId: fixture.userId,
      accountId: fixture.email,
      providerId: 'email',
    });
    await betterAuthAccountRepository.save(account);

    const authMethod = authMethodRepository.create({
      userId: fixture.userId,
      type: AuthMethodType.EMAIL,
      identifier: fixture.email.toLowerCase(),
      isPrimary: true,
      lastUsedAt: now,
    });
    await authMethodRepository.save(authMethod);

    const profile = profileRepository.create({
      id: fixture.profileId,
      userId: fixture.userId,
      firstName: fixture.firstName,
      birthdate,
      age: fixture.age,
      gender: fixture.gender,
      interestedIn: fixture.interestedIn,
      intention: fixture.intention,
      city: fixture.city,
      country: fixture.country,
      lat: fixture.latitude,
      lng: fixture.longitude,
      bio: fixture.bio,
      photoUrl: fixture.photos[0],
      visibility: ProfileVisibility.PUBLIC,
      isComplete: true,
      isVerified: true,
      preferences: {
        ageRange: {
          min: fixture.preference.ageMin,
          max: fixture.preference.ageMax,
        },
        maxDistance: fixture.preference.distanceKm,
        interests: fixture.interests,
        values: fixture.values,
      },
      socialLinks: fixture.socialLinks,
      location: {
        latitude: fixture.latitude,
        longitude: fixture.longitude,
        city: fixture.city,
        country: fixture.country,
      },
      publishedAt: now,
      isActive: true,
    });
    const savedProfile = await profileRepository.save(profile);
    await userRepository.update(fixture.userId, { profileId: fixture.profileId });

    if (fixture.interests.length) {
      const interests = await interestRepository.find({
        where: { name: In(fixture.interests) },
      });

      if (interests.length) {
        await profileRepository
          .createQueryBuilder()
          .relation(Profile, 'interests')
          .of(savedProfile)
          .add(interests);
      }
    }

    const preference = preferenceRepository.create({
      userId: fixture.userId,
      ageMin: fixture.preference.ageMin,
      ageMax: fixture.preference.ageMax,
      distanceKm: fixture.preference.distanceKm,
    });
    await preferenceRepository.save(preference);

    for (const [index, url] of fixture.photos.entries()) {
      const photo = photoRepository.create({
        userId: fixture.userId,
        url,
        position: index + 1,
        isActive: true,
      });
      await photoRepository.save(photo);
    }

    created++;
    console.log(`   ✅ Created synthetic user ${fixture.firstName} ${fixture.lastName}`);
  }

  console.log('\n✨ Test account seeding completed');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
}
