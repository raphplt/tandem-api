import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { BetterAuthUser } from './entities/better-auth-user.entity';
import { BetterAuthSession } from './entities/better-auth-session.entity';
import { BetterAuthAccount } from './entities/better-auth-account.entity';
import { TypeORMAdapter } from './typeorm-adapter';
import { bearer } from 'better-auth/plugins';

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
      plugins: [bearer()],
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
   * Convert Express headers into Fetch Headers for Better Auth consumption.
   */
  private toFetchHeaders(headers: Record<string, unknown>): Headers {
    const fetchHeaders = new Headers();

    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        fetchHeaders.set(key, value);
      } else if (Array.isArray(value)) {
        const first = value.find((candidate) => typeof candidate === 'string');
        if (first) {
          fetchHeaders.set(key, first);
        }
      }
    }

    return fetchHeaders;
  }

  /**
   * Récupère la session via Better Auth en mode Bearer-only.
   * On attend un header Authorization: Bearer <sessionToken> et Better Auth
   * gère l'extraction grâce au plugin Bearer.
   */
  async getSession(headers: Record<string, unknown>): Promise<any | null> {
    const authHeader = (headers.authorization as string | undefined) ?? '';
    if (!authHeader || !authHeader.trim()) {
      return null;
    }

    return this.auth.api.getSession({
      headers: this.toFetchHeaders(headers),
    });
  }
}
