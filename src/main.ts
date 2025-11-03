import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as Sentry from '@sentry/nestjs';
import { Request, Response, NextFunction } from 'express';

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
  const bootstrapLogger = new Logger('Bootstrap');

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
    bootstrapLogger.warn(
      `Falling back to in-memory Socket.IO adapter: ${err.message}`,
    );
  }
  app.useWebSocketAdapter(redisAdapter);

  // API prefix
  app.setGlobalPrefix(configService.get('app.apiPrefix') || 'api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Flint API')
    .setDescription('API for Flint social application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerUsername = configService.get<string>('SWAGGER_USER');
  const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');
  const nodeEnv =
    configService.get<string>('app.nodeEnv') ||
    configService.get<string>('NODE_ENV') ||
    'development';
  const isDevelopment = nodeEnv === 'development';
  let swaggerEnabled = isDevelopment;

  if (!isDevelopment) {
    if (swaggerUsername && swaggerPassword) {
      const enforceSwaggerBasicAuth = (
        req: Request,
        res: Response,
        next: NextFunction,
      ) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Swagger UI"');
          return res.status(401).send('Authentication required');
        }

        const base64Credentials = authHeader.split(' ')[1];
        const decodedCredentials = Buffer.from(
          base64Credentials,
          'base64',
        ).toString('utf-8');
        const [username, ...passwordParts] = decodedCredentials.split(':');
        const password = passwordParts.join(':');

        if (username !== swaggerUsername || password !== swaggerPassword) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Swagger UI"');
          return res.status(401).send('Invalid credentials');
        }

        return next();
      };

      ['/api/docs', '/api/docs-json'].forEach((path) => {
        app.use(path, enforceSwaggerBasicAuth);
      });

      swaggerEnabled = true;
    } else {
      swaggerEnabled = false;
      bootstrapLogger.warn(
        'Swagger UI disabled: set SWAGGER_USER and SWAGGER_PASSWORD to enable it outside development',
      );
    }
  }

  if (swaggerEnabled) {
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('app.port') || 3000;
  const host = configService.get<string>('app.host') || '0.0.0.0';
  await app.listen(port, host);

  const displayedHost = host === '0.0.0.0' ? 'localhost' : host;
  console.log(`🚀 Flint API is running at http://${displayedHost}:${port}`);
  if (swaggerEnabled) {
    console.log(
      `📚 API Documentation available at http://${displayedHost}:${port}/api/docs`,
    );
  }
}

bootstrap();
