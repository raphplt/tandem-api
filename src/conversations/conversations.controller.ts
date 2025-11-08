import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, Roles } from '../auth/decorators';

@Controller('conversations')
@UseGuards(AuthGuard, RolesGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @Roles('admin')
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.conversationsService.findAll();
  }

  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.conversationsService.findByUserId(user.id);
  }

  @Get('active/me')
  findActive(@CurrentUser() user: any) {
    return this.conversationsService.findActiveConversation(user.id);
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationsService.update(id, updateConversationDto);
  }

  @Post(':id/extend')
  extend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.extendConversation(id, user.id);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.closeConversation(id, user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.archiveConversation(id, user.id);
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.markAsRead(id, user.id);
  }

  @Post('from-match/:matchId')
  createFromMatch(@Param('matchId') matchId: string, @CurrentUser() user: any) {
    return this.conversationsService.createFromMatch(matchId, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }
}
