import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { BetterAuthUser } from './entities/better-auth-user.entity';
import { BetterAuthSession } from './entities/better-auth-session.entity';
import { BetterAuthAccount } from './entities/better-auth-account.entity';
import { TypeORMAdapter } from './typeorm-adapter';

@Injectable()
export class BetterAuthService {
  private auth: ReturnType<typeof betterAuth>;

  constructor(
    @InjectRepository(BetterAuthUser)
    private readonly userRepository: Repository<BetterAuthUser>,
    @InjectRepository(BetterAuthSession)
    private readonly sessionRepository: Repository<BetterAuthSession>,
    @InjectRepository(BetterAuthAccount)
    private readonly accountRepository: Repository<BetterAuthAccount>,
    private readonly configService: ConfigService,
  ) {
    const typeORMAdapter = new TypeORMAdapter(
      this.userRepository,
      this.sessionRepository,
      this.accountRepository,
    );

    this.auth = betterAuth({
      database: typeORMAdapter.createAdapter({
        debugLogs: this.configService.get('NODE_ENV') === 'development',
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        updateAge: 60 * 60 * 24, // 1 jour
      },
      advanced: {
        generateId: () => crypto.randomUUID(),
      },
      secret: this.configService.get('jwt.secret'),
      baseURL: this.configService.get('app.baseURL') || 'http://localhost:3001',
      trustedOrigins: [
        this.configService.get('app.corsOrigin') || 'http://localhost:3001',
      ],
    });
  }

  getAuthInstance() {
    return this.auth;
  }
}
