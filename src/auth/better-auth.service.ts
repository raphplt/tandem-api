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

  /**
   * Extrait le token Bearer depuis les headers
   */
  extractBearerToken(headers: Record<string, unknown>): string | null {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    // Format: "Bearer {token}"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1].trim() || null;
  }

  /**
   * Récupère la session depuis un token Bearer directement depuis la base de données
   */
  async getSessionFromBearerToken(token: string): Promise<any | null> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { token },
      });

      if (!session) {
        return null;
      }

      // Vérifier que la session n'est pas expirée
      if (session.expiresAt && new Date() > session.expiresAt) {
        return null;
      }

      // Récupérer l'utilisateur associé
      const user = await this.userRepository.findOne({
        where: { id: session.userId },
      });

      if (!user) {
        return null;
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
        },
        session: {
          id: session.id,
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Récupère la session en essayant d'abord Better Auth puis Bearer token
   * Permet de supporter à la fois les cookies (web) et Bearer tokens (mobile)
   */
  async getSession(headers: Record<string, unknown>): Promise<any | null> {
    // Essayer d'abord avec Better Auth (cookies ou headers standards)
    let session = await this.auth.api.getSession({
      headers: headers as any,
    });

    // Si pas de session via Better Auth, essayer avec Bearer token
    if (!session?.user) {
      const bearerToken = this.extractBearerToken(headers);
      if (bearerToken) {
        session = await this.getSessionFromBearerToken(bearerToken);
      }
    }

    return session;
  }
}
