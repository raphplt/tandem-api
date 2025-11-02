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
import { PushTokensService } from './push-tokens.service';
import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators';

@Controller('push-tokens')
@UseGuards(AuthGuard, RolesGuard)
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post()
  create(@Body() createPushTokenDto: CreatePushTokenDto) {
    return this.pushTokensService.create(createPushTokenDto);
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.pushTokensService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.pushTokensService.findOne(+id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updatePushTokenDto: UpdatePushTokenDto) {
    return this.pushTokensService.update(+id, updatePushTokenDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.pushTokensService.remove(+id);
  }
}
