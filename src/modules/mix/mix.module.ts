import { Module } from '@nestjs/common';
import { MixController } from './mix.controller';
import { MixService } from './mix.service';

@Module({
  controllers: [MixController],
  providers: [MixService],
})
export class MixModule {}
