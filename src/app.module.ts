import { Module } from '@nestjs/common';
import { FileModule } from './modules/file/file.module';
import { AiModule } from './modules/ai/ai.module';
import { TtsModule } from './modules/tts/tts.module';
import { MixModule } from './modules/mix/mix.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [FileModule, AiModule, TtsModule, MixModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
