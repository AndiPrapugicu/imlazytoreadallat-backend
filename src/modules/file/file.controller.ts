import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('file')
@ApiTags('file') // Adaugă tag-ul pentru Swagger
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data') // Specifică tipul de conținut
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.handleFileUpload(file);
  }

  @Get('content')
  async getFileContent(@Query('path') filePath: string) {
    try {
      const content = await this.fileService.readFileContent(filePath);
      return { content };
    } catch (error) {
      console.error('Eroare la citirea fișierului:', error);
      return {
        error:
          'Nu s-a putut citi conținutul fișierului. Verificați calea fișierului.',
      };
    }
  }

  @Post('summary')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async generateSummary(@UploadedFile() file: Express.Multer.File) {
    try {
      const summary = await this.fileService.generateSummary(file);
      return { summary };
    } catch (error) {
      console.error('Eroare la generarea rezumatului:', error);
      return {
        error: 'Nu s-a putut genera rezumatul fișierului.',
      };
    }
  }
}
