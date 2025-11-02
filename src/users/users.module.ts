import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from 'src/profiles/profiles.module';
import { UserAuthMethod } from './entities/user-auth-method.entity';
import { Session } from './entities/session.entity';
import { Photo } from './entities/photo.entity';
import { Verification } from './entities/verification.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserAuthMethod,
      Session,
      Photo,
      Verification,
      AuditLog,
    ]),
    AuthModule,
    ProfilesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
