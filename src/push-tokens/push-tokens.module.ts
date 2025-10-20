import { Module } from '@nestjs/common';
import { PushTokensService } from './push-tokens.service';
import { PushTokensController } from './push-tokens.controller';

@Module({
  controllers: [PushTokensController],
  providers: [PushTokensService],
})
export class PushTokensModule {}
