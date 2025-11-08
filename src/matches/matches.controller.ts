import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, Roles } from '../auth/decorators';
import { Observable } from 'rxjs';
import { MatchSearchStreamService } from './match-search-stream.service';

@Controller('matches')
@UseGuards(AuthGuard, RolesGuard)
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly matchSearchStreamService: MatchSearchStreamService,
  ) {}

  @Post()
  @Roles('admin')
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.matchesService.findAll();
  }

  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.matchesService.findByUserId(user.id);
  }

  @Get('daily')
  findDaily(
    @CurrentUser() user: any,
    @Query('date') date?: string,
  ) {
    const targetDate = date ?? new Date().toISOString();
    return this.matchesService.findDailyMatch(user.id, targetDate);
  }

  @Sse('search/stream')
  searchStream(@CurrentUser() user: any): Observable<MessageEvent> {
    return this.matchSearchStreamService.getStreamForUser(user.id);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.matchesService.acceptMatch(id, user.id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.matchesService.rejectMatch(id, user.id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.matchesService.cancelMatch(id, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }
}
