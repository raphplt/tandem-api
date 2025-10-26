import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { TracingMiddleware } from './common/tracing.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Enable JSON parsing for NestJS
  });
  const configService = app.get(ConfigService);

  // Initialize Sentry
  const sentryDsn = configService.get('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get('NODE_ENV'),
    });
  }

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin') || 'http://localhost:3000',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // Temporairement désactivé pour debug
      transform: true,
      disableErrorMessages: false, // Activer les messages d'erreur détaillés
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Middleware
  app.use(new TracingMiddleware().use);

  // API prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix') || 'api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Tandem API')
    .setDescription('API for Tandem social application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Tandem API is running at http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();