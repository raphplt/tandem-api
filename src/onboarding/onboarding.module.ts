import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingDraft } from './entities/onboarding-draft.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { User } from '../users/entities/user.entity';
import { UserAuthMethod } from '../users/entities/user-auth-method.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ProfilePreference } from '../profiles/entities/profile-preference.entity';
import { Photo } from '../users/entities/photo.entity';
import { Interest } from '../interests/entities/interest.entity';
import { AuditLog } from '../users/entities/audit-log.entity';
import { OnboardingMergeService } from './onboarding-merge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnboardingDraft,
      User,
      UserAuthMethod,
      Profile,
      ProfilePreference,
      Photo,
      Interest,
      AuditLog,
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService, OnboardingMergeService],
  exports: [OnboardingService, OnboardingMergeService],
})
export class OnboardingModule {}
