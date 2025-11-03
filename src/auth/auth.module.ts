import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Availability } from '../availability/entities/availability.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Match } from '../matches/entities/match.entity';
import { Message } from '../messages/entities/message.entity';
import { BetterAuthUser } from './entities/better-auth-user.entity';
import { BetterAuthSession } from './entities/better-auth-session.entity';
import { BetterAuthAccount } from './entities/better-auth-account.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './better-auth.service';
import { TypeORMAdapter } from './typeorm-adapter';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { OwnershipGuard } from './ownership.guard';
import { WsAuthGuard } from './ws-auth.guard';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      BetterAuthUser,
      BetterAuthSession,
      BetterAuthAccount,
      Profile,
      Availability,
      Conversation,
      Match,
      Message,
    ]),
    ConfigModule,
    OnboardingModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    BetterAuthService,
    TypeORMAdapter,
    AuthGuard,
    RolesGuard,
    OwnershipGuard,
    WsAuthGuard,
  ],
  exports: [
    AuthService,
    BetterAuthService,
    AuthGuard,
    RolesGuard,
    OwnershipGuard,
    WsAuthGuard,
  ],
})
export class AuthModule {}
