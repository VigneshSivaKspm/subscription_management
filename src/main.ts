import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use('/webhook', express.raw({ type: 'application/json' }));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
