import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PushTokensService } from './push-tokens.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

@Controller('push-tokens')
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post()
  create(@Body() createPushTokenDto: CreatePushTokenDto) {
    return this.pushTokensService.create(createPushTokenDto);
  }

  @Get()
  findAll() {
    return this.pushTokensService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pushTokensService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePushTokenDto: UpdatePushTokenDto) {
    return this.pushTokensService.update(+id, updatePushTokenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pushTokensService.remove(+id);
  }
}
