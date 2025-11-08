import { Injectable, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { from, fromEventPattern, interval, merge, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { AvailabilityService } from '../availability/availability.service';
import { AvailabilityResponseDto } from '../availability/dto/availability-response.dto';
import { AvailabilityStatus } from '../availability/entities/availability.entity';
import { MatchesService } from './matches.service';
import { MatchResponseDto } from './dto/match-response.dto';

interface MatchSearchPayload {
  type: 'search_state' | 'match_found' | 'heartbeat';
  status?: AvailabilityStatus;
  queuedAt?: Date | null;
  timeInQueue?: number;
  isOnline?: boolean;
  match?: MatchResponseDto;
  timestamp?: string;
}

@Injectable()
export class MatchSearchStreamService {
  private readonly HEARTBEAT_INTERVAL_MS = 15_000;

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly matchesService: MatchesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getStreamForUser(userId: string): Observable<MessageEvent> {
    const initial$ = from(this.buildInitialPayloads(userId)).pipe(
      mergeMap((events) => from(events)),
    );

    const availability$ = fromEventPattern<AvailabilityResponseDto>(
      (handler) =>
        this.eventEmitter.on(`availability.status.${userId}`, handler),
      (handler) =>
        this.eventEmitter.off(`availability.status.${userId}`, handler),
    ).pipe(map((availability) => this.buildAvailabilityPayload(availability)));

    const matches$ = fromEventPattern<MatchResponseDto>(
      (handler) => this.eventEmitter.on(`matches.found.${userId}`, handler),
      (handler) => this.eventEmitter.off(`matches.found.${userId}`, handler),
    ).pipe(map((match) => ({ type: 'match_found', match } as MatchSearchPayload)));

    const heartbeat$ = interval(this.HEARTBEAT_INTERVAL_MS).pipe(
      map(
        () =>
          ({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          }) as MatchSearchPayload,
      ),
    );

    return merge(initial$, availability$, matches$, heartbeat$).pipe(
      map((data) => ({ data })),
    );
  }

  private async buildInitialPayloads(
    userId: string,
  ): Promise<MatchSearchPayload[]> {
    const events: MatchSearchPayload[] = [];
    const availability = await this.availabilityService.getCurrentAvailability(
      userId,
    );

    events.push(this.buildAvailabilityPayload(availability));

    const today = new Date();
    const existingMatch = await this.matchesService.findDailyMatch(
      userId,
      today.toISOString(),
    );

    if (existingMatch) {
      events.push({ type: 'match_found', match: existingMatch });
    }

    return events;
  }

  private buildAvailabilityPayload(
    availability?: AvailabilityResponseDto | null,
  ): MatchSearchPayload {
    return {
      type: 'search_state',
      status: availability?.status ?? AvailabilityStatus.IDLE,
      queuedAt: availability?.queuedAt ?? null,
      timeInQueue: availability?.timeInQueue ?? 0,
      isOnline: availability?.isOnline ?? false,
    };
  }
}
