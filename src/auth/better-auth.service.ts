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
        requireEmailVerification:
          this.configService.get('app.nodeEnv') === 'production',
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        updateAge: 60 * 60 * 24, // 1 jour
      },
      advanced: {
        generateId: () => crypto.randomUUID(),
      },
      secret:
        this.configService.get('auth.secret') ||
        process.env.AUTH_SECRET ||
        'change-me-in-production',
      baseURL:
        this.configService.get('auth.baseURL') || 'http://localhost:3001',
      trustedOrigins: [
        this.configService.get('app.corsOrigin') || 'http://localhost:3001',
      ],
    });
  }

  getAuthInstance() {
    return this.auth;
  }

  /**
   * Récupère la session via Better Auth en mode Bearer-only.
   * On attend un header Authorization: Bearer <sessionToken> et on le
   * transmet à Better Auth sous forme de cookie attendu par son API interne.
   */
  async getSession(headers: Record<string, unknown>): Promise<any | null> {
    const authHeader = (headers.authorization as string | undefined) ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return null;
    }

    return await this.auth.api.getSession({
      headers: { cookie: `better-auth.session_token=${token}` } as any,
    });
  }
}
