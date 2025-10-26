import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      BetterAuthUser,
      BetterAuthSession,
      BetterAuthAccount,
    ]),
    ConfigModule,
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