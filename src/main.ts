import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AtGuard } from './common/guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  // if (process.env.NODE_ENV !== 'production') {
  //   const options = new DocumentBuilder()
  //     .setTitle('NestJS LOGIN RT')
  //     .setDescription('Login Backend with tokens')
  //     .setVersion('1.0')
  //     .addBasicAuth()
  //     .build();

  //   const document = SwaggerModule.createDocument(app, options);
  //   SwaggerModule.setup('api-doc', app, document);
  // }

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  // const reflector = new Reflector();
  // app.useGlobalGuards(new AtGuard(reflector));
  await app.listen(Number(process.env.NODE_PORT) || 3001);
}
bootstrap();
