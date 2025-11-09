import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'development') {
    return {
      port: parseInt(process.env.PORT || '3001', 10),
      host: process.env.HOST || '0.0.0.0',
      apiPrefix: process.env.API_PREFIX || 'api/v1',
      nodeEnv,
      corsOrigin: '*',
    };
  }

  const rawOrigins = process.env.CORS_ORIGIN ?? 'http://localhost:3001';
  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    nodeEnv,
    corsOrigin: origins.length === 1 ? origins[0] : origins,
  };
});
