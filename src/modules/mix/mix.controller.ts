import { Controller, Post, Body } from '@nestjs/common';
import { MixService } from './mix.service';

@Controller('mix')
export class MixController {
  constructor(private readonly mixService: MixService) {}

  @Post('combine')
  combineAudio(
    @Body('audioPath') audioPath: string,
    @Body('musicPath') musicPath: string,
  ) {
    return this.mixService.combineAudio(audioPath, musicPath);
  }
}
