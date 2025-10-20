import { Injectable } from '@nestjs/common';
import { CreatePushTokenDto } from './dto/create-push-token.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';

@Injectable()
export class PushTokensService {
  create(createPushTokenDto: CreatePushTokenDto) {
    return 'This action adds a new pushToken';
  }

  findAll() {
    return `This action returns all pushTokens`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pushToken`;
  }

  update(id: number, updatePushTokenDto: UpdatePushTokenDto) {
    return `This action updates a #${id} pushToken`;
  }

  remove(id: number) {
    return `This action removes a #${id} pushToken`;
  }
}
