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
import { MatchmakingService } from './matchmaking.service';
import { Availability } from '../availability/entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Profile, User, Availability]),
    AuthModule,
    AvailabilityModule,
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchSearchStreamService, MatchmakingService],
  exports: [MatchesService],
})
export class MatchesModule {}
