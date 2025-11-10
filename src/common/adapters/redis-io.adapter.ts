import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';
import type { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;

  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    if (this.adapterConstructor) {
      return;
    }

    const configService = this.app.get(ConfigService);
    const host = configService.get<string>('redis.host', 'localhost');
    const port = configService.get<number>('redis.port', 6379);
    const password = configService.get<string>('redis.password');
    const db = configService.get<number>('redis.db', 0);

    const url = password
      ? `redis://:${encodeURIComponent(password)}@${host}:${port}/${db}`
      : `redis://${host}:${port}/${db}`;

    this.pubClient = createClient({ url });
    this.subClient = this.pubClient.duplicate();

    try {
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to connect Socket.IO adapter to Redis: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    } else {
      this.logger.warn(
        'Redis adapter not initialized, using default in-memory adapter',
      );
    }

    return server;
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.pubClient?.quit(), this.subClient?.quit()]);
    this.pubClient = undefined;
    this.subClient = undefined;
    this.adapterConstructor = undefined;
  }
}
