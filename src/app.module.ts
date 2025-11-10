import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { redisStore } from 'cache-manager-redis-store';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import appConfig from './config/app.config';
import r2Config from './config/r2.config';
import { User } from './users/entities/user.entity';
import { Profile } from './profiles/entities/profile.entity';
import { ProfilePreference } from './profiles/entities/profile-preference.entity';
import { Availability } from './availability/entities/availability.entity';
import { Match } from './matches/entities/match.entity';
import { Conversation } from './conversations/entities/conversation.entity';
import { Message } from './messages/entities/message.entity';
import { Reward } from './rewards/entities/reward.entity';
import { Report } from './reports/entities/report.entity';
import { PushToken } from './push-tokens/entities/push-token.entity';
import { Interest } from './interests/entities/interest.entity';
import { Value } from './values/entities/value.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Admin } from './admin/entities/admin.entity';
import { Analytics } from './analytics/entities/analytics.entity';
import { BetterAuthUser } from './auth/entities/better-auth-user.entity';
import { BetterAuthSession } from './auth/entities/better-auth-session.entity';
import { BetterAuthAccount } from './auth/entities/better-auth-account.entity';
import { OnboardingDraft } from './onboarding/entities/onboarding-draft.entity';
import { UserAuthMethod } from './users/entities/user-auth-method.entity';
import { Session } from './users/entities/session.entity';
import { Photo } from './users/entities/photo.entity';
import { Verification } from './users/entities/verification.entity';
import { AuditLog } from './users/entities/audit-log.entity';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AvailabilityModule } from './availability/availability.module';
import { MatchesModule } from './matches/matches.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { RewardsModule } from './rewards/rewards.module';
import { ReportsModule } from './reports/reports.module';
import { PushTokensModule } from './push-tokens/push-tokens.module';
import { InterestsModule } from './interests/interests.module';
import { ValuesModule } from './values/values.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import authConfig from './config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, appConfig, authConfig, r2Config],
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
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
        ],
        synchronize: configService.get('database.synchronize'),
        // logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_TTL', 60) * 1000,
            limit: configService.get('RATE_LIMIT_LIMIT', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),

    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        password: configService.get('redis.password'),
        db: configService.get('redis.db') + 1,
      }),
      inject: [ConfigService],
    }),

    EventEmitterModule.forRoot(),

    UsersModule,
    ProfilesModule,
    AvailabilityModule,
    MatchesModule,
    ConversationsModule,
    MessagesModule,
    RewardsModule,
    ReportsModule,
    PushTokensModule,
    InterestsModule,
    ValuesModule,
    NotificationsModule,
    AdminModule,
    AnalyticsModule,
    OnboardingModule,
    MediaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
