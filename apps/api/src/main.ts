import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('LEGAL_AID_AI_API');
  const app = await NestFactory.create(AppModule);

  // Global prefixes and middlewares
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('LEGAL AID AI API')
    .setDescription('O‘zbekiston Huquqiy Ta\'lim Telegram kanali (@Huquq_study) boshqaruv platformasi REST API hujjatlari.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.APP_PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 LEGAL AID AI API server muvaffaqiyatli ishga tushdi: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger hujjatlari: http://localhost:${port}/api/docs`);
}

bootstrap();
