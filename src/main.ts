import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('NestJS LOGIN RT')
      .setDescription('Login Backend with tokens')
      .setVersion('1.0')
      .addBasicAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-doc', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(Number(process.env.NODE_PORT) || 3001);
}
bootstrap();
