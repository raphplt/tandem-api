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
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AuthGuard } from '../auth/auth.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { CurrentUser } from '../auth/decorators';

@Controller('messages')
@UseGuards(AuthGuard, OwnershipGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @CurrentUser() user: any) {
    return this.messagesService.create(createMessageDto, user.id);
  }

  @Get()
  findAll(
    @Query('conversationId') conversationId: string,
    @Query('limit') limitParam: string | undefined,
    @Query('offset') offsetParam: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!conversationId) {
      throw new BadRequestException(
        'Query parameter "conversationId" is required',
      );
    }

    const DEFAULT_LIMIT = 50;
    const MAX_LIMIT = 100;

    const parsedLimit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
    const parsedOffset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('Query parameter "limit" must be a number greater than 0');
    }

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      throw new BadRequestException('Query parameter "offset" must be a non-negative number');
    }

    const limit = Math.min(parsedLimit, MAX_LIMIT);
    const offset = parsedOffset;

    return this.messagesService.findAll(conversationId, user.id, limit, offset);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.update(id, updateMessageDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.delete(id, user.id);
  }
}
