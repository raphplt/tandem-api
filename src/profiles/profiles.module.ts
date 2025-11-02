import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from './entities/profile.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfilePreference } from './entities/profile-preference.entity';
import { User } from '../users/entities/user.entity';
import { Interest } from '../interests/entities/interest.entity';
import { Photo } from '../users/entities/photo.entity';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, ProfilePreference, User, Interest, Photo]),
    AuthModule,
    OnboardingModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
