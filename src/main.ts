import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as httpProxy from 'http-proxy-middleware';
import { Server } from 'http';

let server: Server;

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  // Servirea fișierelor statice din directorul "uploads"
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Proxy pentru serverul Flask
  app.use(
    '/summarize',
    httpProxy.createProxyMiddleware({
      target: 'https://llama-server-py.onrender.com', // Serverul Flask pe Render
      changeOrigin: true,
    }),
  );

  // Configurare Swagger
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Documentația API pentru aplicația ta')
    .setVersion('1.0')
    .addTag('file') // Adaugă tag-uri pentru module
    .addTag('ai')
    .addTag('tts')
    .addTag('mix')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Adaugă manual endpoint-ul Flask
  document.paths['/summarize'] = {
    post: {
      tags: ['file'],
      summary: 'Rezumă textul primit',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                text: { type: 'string' },
              },
              required: ['text'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Rezumat generat cu succes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                },
              },
            },
          },
        },
        500: {
          description: 'Eroare la generarea rezumatului',
        },
      },
    },
  };

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  server = app.getHttpAdapter().getInstance();
}

bootstrap();

// Expune handler-ul pentru Vercel
export default (req, res) => {
  if (!server) {
    bootstrap().then(() => server.emit('request', req, res));
  } else {
    server.emit('request', req, res);
  }
};
