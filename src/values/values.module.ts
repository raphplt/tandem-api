import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValuesService } from './values.service';
import { ValuesController } from './values.controller';
import { Value } from './entities/value.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Value]), AuthModule],
  controllers: [ValuesController],
  providers: [ValuesService],
  exports: [ValuesService],
})
export class ValuesModule {}