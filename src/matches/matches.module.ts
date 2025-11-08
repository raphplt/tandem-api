import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { Match } from './entities/match.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { MatchSearchStreamService } from './match-search-stream.service';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Profile, User]),
    AuthModule,
    AvailabilityModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchSearchStreamService],
  exports: [MatchesService],
})
export class MatchesModule {}
