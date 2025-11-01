import { DataSource } from 'typeorm';
import { INTERESTS_SEED_DATA } from './seeders/interests.seeder';
import { Interest } from '../interests/entities/interest.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
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

try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  console.log('No .env file found');
}

async function createDataSource(synchronize = false): Promise<DataSource> {
  return new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'tandem_db',
    entities: [
      User,
      Profile,
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
      BetterAuthUser,
      BetterAuthSession,
      BetterAuthAccount,
    ],
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
    const entities = [
      BetterAuthAccount,
      BetterAuthSession,
      BetterAuthUser,
      Message,
      Conversation,
      Match,
      Availability,
      Profile,
      Reward,
      Report,
      PushToken,
      Interest,
      Value,
      Notification,
      Admin,
      Analytics,
      User,
    ];

    for (const entity of entities) {
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
  // Parse command line arguments
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
