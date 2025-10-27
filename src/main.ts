import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as Sentry from '@sentry/nestjs';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { LoggingInterceptor } from './common/logging.interceptor';
import { TracingMiddleware } from './common/tracing.middleware';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
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
      // forbidNonWhitelisted: false, // Temporairement désactivé pour debug
      transform: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Middleware
  app.use(new TracingMiddleware().use);

  // WebSocket adapter
  const redisAdapter = new RedisIoAdapter(app);
  try {
    await redisAdapter.connectToRedis();
  } catch (error) {
    const err = error as Error;
    const bootstrapLogger = new Logger('Bootstrap');
    bootstrapLogger.warn(
      `Falling back to in-memory Socket.IO adapter: ${err.message}`,
    );
  }
  app.useWebSocketAdapter(redisAdapter);

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

  const port = configService.get<number>('app.port') || 3000;
  const host = configService.get<string>('app.host') || '0.0.0.0';
  await app.listen(port, host);

  const displayedHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`🚀 Tandem API is running at http://${displayedHost}:${port}`);
  console.log(
    `📚 API Documentation available at http://${displayedHost}:${port}/api/docs`,
  );
}

bootstrap();