import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('reformat')
  reformatText(@Body('text') text: string) {
    return this.aiService.reformatText(text);
  }
}
