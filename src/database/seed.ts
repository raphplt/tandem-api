import { DataSource } from 'typeorm';
import { hashPassword } from 'better-auth/crypto';
import { INTERESTS_SEED_DATA } from './seeders/interests.seeder';
import { Interest } from '../interests/entities/interest.entity';
import { User } from '../users/entities/user.entity';
import { Profile, Gender } from '../profiles/entities/profile.entity';
import { ProfilePreference } from '../profiles/entities/profile-preference.entity';
import { Availability } from '../availability/entities/availability.entity';
import { Match } from '../matches/entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Report } from '../reports/entities/report.entity';
import { PushToken } from '../push-tokens/entities/push-token.entity';
import { Value } from '../values/entities/value.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Admin } from '../admin/entities/admin.entity';
import { Analytics } from '../analytics/entities/analytics.entity';
import { BetterAuthUser } from '../auth/entities/better-auth-user.entity';
import { BetterAuthSession } from '../auth/entities/better-auth-session.entity';
import { BetterAuthAccount } from '../auth/entities/better-auth-account.entity';
import { OnboardingDraft } from '../onboarding/entities/onboarding-draft.entity';
import {
  AuthMethodType,
  UserAuthMethod,
} from '../users/entities/user-auth-method.entity';
import { Session } from '../users/entities/session.entity';
import { Photo } from '../users/entities/photo.entity';
import { Verification } from '../users/entities/verification.entity';
import { AuditLog } from '../users/entities/audit-log.entity';
import { UserRole } from '../common/enums/user.enums';

try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  console.log('No .env file found');
}

const ENTITY_LIST = [
  User,
  Profile,
  ProfilePreference,
  Availability,
  Match,
  Conversation,
  Message,
  Reward,
  Report,
  PushToken,
  Interest,
  Value,
  Notification,
  Admin,
  Analytics,
  OnboardingDraft,
  UserAuthMethod,
  Session,
  Photo,
  Verification,
  AuditLog,
  BetterAuthUser,
  BetterAuthSession,
  BetterAuthAccount,
];

interface SeedUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
  birthdate: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  intention: string;
  bio: string;
  interestedIn: Gender[];
  interests: string[];
  photoUrl: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  preferenceAgeMin: number;
  preferenceAgeMax: number;
  preferenceDistanceKm: number;
  isVerified?: boolean;
}

const USER_SEED_DATA: SeedUserData[] = [
  {
    firstName: 'Lea',
    lastName: 'Dupont',
    email: 'lea.dupont@demo.app',
    password: 'LoveParis!1',
    gender: Gender.FEMALE,
    birthdate: '1994-03-14',
    city: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    intention: 'Relation serieuse et projets communs',
    bio: 'Cheffe de projet culture qui adore les expos, les cafes lumineux et les balades sur les quais.',
    interestedIn: [Gender.MALE],
    interests: ['Yoga', 'Cooking', 'Photography'],
    photoUrl:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'lea.moves',
      website: 'https://lea-journal.com',
    },
    preferenceAgeMin: 28,
    preferenceAgeMax: 38,
    preferenceDistanceKm: 30,
    isVerified: true,
  },
  {
    firstName: 'Chloe',
    lastName: 'Garnier',
    email: 'chloe.garnier@demo.app',
    password: 'LyonVibes!2',
    gender: Gender.FEMALE,
    birthdate: '1992-11-02',
    city: 'Lyon',
    country: 'France',
    lat: 45.764,
    lng: 4.8357,
    intention: 'Trouver un partenaire de randos et de bons restos',
    bio: 'Architecte interieure fan de montagne, de nature et de bons vins du Beaujolais.',
    interestedIn: [Gender.MALE],
    interests: ['Hiking', 'Wine Tasting', 'Painting'],
    photoUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'chloe.draws',
    },
    preferenceAgeMin: 30,
    preferenceAgeMax: 40,
    preferenceDistanceKm: 60,
    isVerified: true,
  },
  {
    firstName: 'Ines',
    lastName: 'Moreau',
    email: 'ines.moreau@demo.app',
    password: 'SunsetTalk!3',
    gender: Gender.FEMALE,
    birthdate: '1995-07-19',
    city: 'Marseille',
    country: 'France',
    lat: 43.2965,
    lng: 5.3698,
    intention: 'Rencontres solaires et voyages improvises',
    bio: 'Community manager qui vit pieds nus des que possible. Toujours partante pour un spot sunset.',
    interestedIn: [Gender.MALE, Gender.FEMALE],
    interests: ['Beach Holidays', 'Street Food', 'Dance'],
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'ines.wave',
    },
    preferenceAgeMin: 26,
    preferenceAgeMax: 36,
    preferenceDistanceKm: 25,
    isVerified: false,
  },
  {
    firstName: 'Mila',
    lastName: 'Renard',
    email: 'mila.renard@demo.app',
    password: 'CoffeeRuns!4',
    gender: Gender.FEMALE,
    birthdate: '1993-05-08',
    city: 'Bordeaux',
    country: 'France',
    lat: 44.8378,
    lng: -0.5792,
    intention: 'Construire une relation stable et curieuse',
    bio: 'Product manager remote qui collectionne les cafes de quartier et les runs sur les quais.',
    interestedIn: [Gender.MALE],
    interests: ['Running', 'Coffee', 'Reading'],
    photoUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      linkedin: 'mila-renard',
    },
    preferenceAgeMin: 29,
    preferenceAgeMax: 38,
    preferenceDistanceKm: 40,
    isVerified: true,
  },
  {
    firstName: 'Zoe',
    lastName: 'Lemire',
    email: 'zoe.lemire@demo.app',
    password: 'NordicMuse!5',
    gender: Gender.FEMALE,
    birthdate: '1996-01-27',
    city: 'Lille',
    country: 'France',
    lat: 50.6292,
    lng: 3.0573,
    intention: 'Rencontres creatives et voyages weekend',
    bio: 'Lead designer qui adore les velos vintages, les friperies et les podcasts inspi.',
    interestedIn: [Gender.MALE, Gender.FEMALE],
    interests: ['Cycling', 'Fashion', 'Podcasts'],
    photoUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'zoe.nord',
    },
    preferenceAgeMin: 27,
    preferenceAgeMax: 37,
    preferenceDistanceKm: 35,
    isVerified: true,
  },
  {
    firstName: 'Lucas',
    lastName: 'Martin',
    email: 'lucas.martin@demo.app',
    password: 'GoalGetter!6',
    gender: Gender.MALE,
    birthdate: '1990-09-15',
    city: 'Paris',
    country: 'France',
    lat: 48.8708,
    lng: 2.3785,
    intention: 'Trouver une partenaire motivee par les memes ambitions',
    bio: 'CEO d une scale-up climat, accro au foot du dimanche et aux cafetieres italiennes.',
    interestedIn: [Gender.FEMALE],
    interests: ['Football', 'Entrepreneurship', 'Fitness'],
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      linkedin: 'lucas-martin',
      website: 'https://impact-lab.io',
    },
    preferenceAgeMin: 27,
    preferenceAgeMax: 36,
    preferenceDistanceKm: 40,
    isVerified: true,
  },
  {
    firstName: 'Hugo',
    lastName: 'Leroy',
    email: 'hugo.leroy@demo.app',
    password: 'SurfAndCode!7',
    gender: Gender.MALE,
    birthdate: '1991-12-03',
    city: 'Biarritz',
    country: 'France',
    lat: 43.4832,
    lng: -1.5586,
    intention: 'Partager sessions de surf, bons cafes et road trips',
    bio: 'Developer freelance qui partage son temps entre l ocean, le code et les decouvertes locales.',
    interestedIn: [Gender.FEMALE],
    interests: ['Surfing', 'Craft Beer', 'Rock'],
    photoUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'hugo.surf',
    },
    preferenceAgeMin: 28,
    preferenceAgeMax: 38,
    preferenceDistanceKm: 60,
    isVerified: false,
  },
  {
    firstName: 'Theo',
    lastName: 'Girard',
    email: 'theo.girard@demo.app',
    password: 'ClimbPlay!8',
    gender: Gender.MALE,
    birthdate: '1995-04-11',
    city: 'Toulouse',
    country: 'France',
    lat: 43.6047,
    lng: 1.4442,
    intention: 'Chercher une connexion simple, sportive et curieuse',
    bio: 'Ingenieur IA qui passe ses soirees a grimper et tester des jeux indies avec ses potes.',
    interestedIn: [Gender.FEMALE],
    interests: ['Climbing', 'Programming', 'Gaming'],
    photoUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      website: 'https://theo-builds.dev',
    },
    preferenceAgeMin: 25,
    preferenceAgeMax: 34,
    preferenceDistanceKm: 50,
    isVerified: true,
  },
  {
    firstName: 'Maxime',
    lastName: 'Payet',
    email: 'maxime.payet@demo.app',
    password: 'AzureRide!9',
    gender: Gender.MALE,
    birthdate: '1989-08-22',
    city: 'Nice',
    country: 'France',
    lat: 43.7102,
    lng: 7.262,
    intention: 'Construire une relation lumineuse autour du voyage',
    bio: 'Coach adventure qui planifie chaque road trip comme un film et capture tout en photo.',
    interestedIn: [Gender.FEMALE],
    interests: ['Adventure Travel', 'Road Trips', 'Photography'],
    photoUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      instagram: 'max.roadtrip',
    },
    preferenceAgeMin: 30,
    preferenceAgeMax: 42,
    preferenceDistanceKm: 80,
    isVerified: true,
  },
  {
    firstName: 'Yanis',
    lastName: 'Perrin',
    email: 'yanis.perrin@demo.app',
    password: 'RhineRoad!0',
    gender: Gender.MALE,
    birthdate: '1994-06-30',
    city: 'Strasbourg',
    country: 'France',
    lat: 48.5734,
    lng: 7.7521,
    intention: 'Trouver quelqu un de pose pour partager sports et voyages',
    bio: 'Chef de projet energie verte, cycliste toute l annee et fan de cafes de quartier.',
    interestedIn: [Gender.FEMALE],
    interests: ['Cycling', 'Meditation', 'Board Games'],
    photoUrl:
      'https://images.unsplash.com/photo-1542204625-ca1c0b1c0aa8?auto=format&fit=crop&w=600&q=80',
    socialLinks: {
      linkedin: 'yanis-perrin',
    },
    preferenceAgeMin: 27,
    preferenceAgeMax: 37,
    preferenceDistanceKm: 45,
    isVerified: true,
  },
];

function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}
async function createDataSource(synchronize = false): Promise<DataSource> {
  return new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'tandem_db',
    entities: ENTITY_LIST,
    synchronize,
    logging: false,
  });
}

async function seedInterests(dataSource: DataSource): Promise<void> {
  const interestRepository = dataSource.getRepository(Interest);

  console.log('🌱 Seeding interests...');

  let created = 0;
  let skipped = 0;

  for (const interestData of INTERESTS_SEED_DATA) {
    const existingInterest = await interestRepository.findOne({
      where: { name: interestData.name },
    });

    if (existingInterest) {
      console.log(`   ⏭️  Skipping "${interestData.name}" (already exists)`);
      skipped++;
      continue;
    }

    const interest = interestRepository.create({
      name: interestData.name,
      description: interestData.description,
      category: interestData.category,
      icon: interestData.icon,
      color: interestData.color,
      tags: interestData.tags || [],
      isActive: true,
      profileCount: 0,
      popularityScore: 0,
    });

    await interestRepository.save(interest);
    console.log(
      `   ✅ Created "${interestData.name}" ${interestData.icon || ''}`,
    );
    created++;
  }

  console.log(`\n✨ Interests seeding completed!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${INTERESTS_SEED_DATA.length}`);
}

async function seedUsers(dataSource: DataSource): Promise<void> {
  const betterAuthUserRepository = dataSource.getRepository(BetterAuthUser);
  const betterAuthAccountRepository =
    dataSource.getRepository(BetterAuthAccount);
  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(Profile);
  const profilePreferenceRepository =
    dataSource.getRepository(ProfilePreference);
  const userAuthMethodRepository = dataSource.getRepository(UserAuthMethod);
  const interestRepository = dataSource.getRepository(Interest);

  console.log('\n🌱 Seeding demo users...');

  const allInterests = await interestRepository.find();
  const interestMap = new Map(
    allInterests.map((interest) => [interest.name.toLowerCase(), interest]),
  );

  let created = 0;
  let skipped = 0;

  for (const seedUser of USER_SEED_DATA) {
    const normalizedEmail = seedUser.email.toLowerCase();

    const existingAuthUser = await betterAuthUserRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingAuthUser) {
      console.log(`   ⏭️  Skipping "${seedUser.email}" (already exists)`);
      skipped++;
      continue;
    }

    const birthdate = new Date(seedUser.birthdate);
    const age = calculateAge(birthdate);

    const matchedInterests = seedUser.interests
      .map((interestName) => {
        const entity = interestMap.get(interestName.toLowerCase());
        if (!entity) {
          console.warn(
            `   ⚠️  Interest "${interestName}" not found for ${seedUser.email}`,
          );
        }
        return entity;
      })
      .filter((interest): interest is Interest => Boolean(interest));

    try {
      const betterAuthUser = betterAuthUserRepository.create({
        email: normalizedEmail,
        name: `${seedUser.firstName} ${seedUser.lastName}`.trim(),
        image: seedUser.photoUrl,
        emailVerified: true,
      });
      const savedBetterAuthUser =
        await betterAuthUserRepository.save(betterAuthUser);

      const passwordHash = await hashPassword(seedUser.password);

      const betterAuthAccount = betterAuthAccountRepository.create({
        userId: savedBetterAuthUser.id,
        accountId: savedBetterAuthUser.id,
        providerId: 'credential',
        password: passwordHash,
      });
      await betterAuthAccountRepository.save(betterAuthAccount);

      const userEntity = userRepository.create({
        id: savedBetterAuthUser.id,
        email: normalizedEmail,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        roles: [UserRole.USER],
        dateOfBirth: birthdate,
        isActive: true,
        onboardedAt: new Date(),
      });
      const savedUser = await userRepository.save(userEntity);

      const profile = profileRepository.create({
        userId: savedUser.id,
        firstName: seedUser.firstName,
        birthdate,
        age,
        gender: seedUser.gender,
        interestedIn: seedUser.interestedIn,
        intention: seedUser.intention,
        city: seedUser.city,
        country: seedUser.country,
        lat: seedUser.lat,
        lng: seedUser.lng,
        bio: seedUser.bio,
        photoUrl: seedUser.photoUrl,
        isComplete: true,
        isVerified: seedUser.isVerified ?? true,
        preferences: {
          ageRange: {
            min: seedUser.preferenceAgeMin,
            max: seedUser.preferenceAgeMax,
          },
          maxDistance: seedUser.preferenceDistanceKm,
          interests: seedUser.interests,
        },
        socialLinks: seedUser.socialLinks,
        location: {
          latitude: seedUser.lat,
          longitude: seedUser.lng,
          city: seedUser.city,
          country: seedUser.country,
        },
        publishedAt: new Date(),
        isActive: true,
      });
      profile.interests = matchedInterests;

      const savedProfile = await profileRepository.save(profile);

      await userRepository.update(savedUser.id, {
        profileId: savedProfile.id,
      });

      const preference = profilePreferenceRepository.create({
        userId: savedUser.id,
        ageMin: seedUser.preferenceAgeMin,
        ageMax: seedUser.preferenceAgeMax,
        distanceKm: seedUser.preferenceDistanceKm,
      });
      await profilePreferenceRepository.save(preference);

      const authMethod = userAuthMethodRepository.create({
        userId: savedUser.id,
        type: AuthMethodType.EMAIL,
        identifier: normalizedEmail,
        isPrimary: true,
        lastUsedAt: new Date(),
      });
      await userAuthMethodRepository.save(authMethod);

      console.log(
        `   ✅ Created demo user "${seedUser.firstName} ${seedUser.lastName}"`,
      );
      created++;
    } catch (error) {
      console.error(
        `   ❌ Failed to create user "${seedUser.email}":`,
        error,
      );
    }
  }

  console.log(`\n✨ User seeding completed!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${USER_SEED_DATA.length}`);
}

async function dropDatabase(dataSource: DataSource): Promise<void> {
  console.log('🗑️  Dropping all tables...');

  try {
    // Get all table names
    const queryRunner = dataSource.createQueryRunner();

    // Drop junction tables first
    const junctionTables = ['profile_interests', 'profile_values'];
    for (const tableName of junctionTables) {
      try {
        await queryRunner.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        console.log(`   ✅ Dropped table: ${tableName}`);
      } catch (error) {
        // Ignore if table doesn't exist
      }
    }

    // Drop entity tables
    for (const entity of ENTITY_LIST) {
      try {
        const metadata = dataSource.getMetadata(entity);
        await queryRunner.query(
          `DROP TABLE IF EXISTS "${metadata.tableName}" CASCADE;`,
        );
        console.log(`   ✅ Dropped table: ${metadata.tableName}`);
      } catch (error) {
        // Ignore if table doesn't exist
      }
    }

    await queryRunner.release();
    console.log('✨ All tables dropped successfully!\n');
  } catch (error) {
    console.error('❌ Error dropping database:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDrop = args.includes('--drop') || args.includes('-d');

  console.log('🚀 Starting database seeding...\n');

  let dataSource: DataSource;

  if (shouldDrop) {
    console.log('⚠️  WARNING: This will drop all tables and data!');

    // Create dataSource for dropping
    dataSource = await createDataSource(false);
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    await dropDatabase(dataSource);
    await dataSource.destroy();

    // Recreate tables by synchronizing (only in development)
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === undefined
    ) {
      console.log('🔄 Recreating tables...');
      // Create new DataSource with synchronize enabled
      dataSource = await createDataSource(true);
      await dataSource.initialize();
      console.log('✅ Tables recreated\n');
    } else {
      console.log(
        '⚠️  Please run migrations to recreate tables in production!\n',
      );
      process.exit(0);
    }
  } else {
    dataSource = await createDataSource(false);
    await dataSource.initialize();
    console.log('✅ Database connection established\n');
  }

  try {
    // Seed interests
    await seedInterests(dataSource);
    await seedUsers(dataSource);

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seeder
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
