import { Controller, Post, Body } from '@nestjs/common';
import { TtsService } from './tts.service';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('generate')
  async generateAudio(
    @Body('text') text: string,
    @Body('backgroundType') backgroundType: 'lofi' | 'rap',
    @Body('language') language: string, // Adăugat: Parametru pentru limba selectată
  ) {
    return this.ttsService.generateAudio(text, backgroundType, language); // Trimite limba către serviciu
  }
}
