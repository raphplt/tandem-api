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
    private userRepository: Repository<BetterAuthUser>,
    @InjectRepository(BetterAuthSession)
    private sessionRepository: Repository<BetterAuthSession>,
    @InjectRepository(BetterAuthAccount)
    private accountRepository: Repository<BetterAuthAccount>,
    private configService: ConfigService,
  ) {
    console.log('🔧 Initializing BetterAuthService...');
    
    try {
      // Créer l'adaptateur TypeORM
      const typeORMAdapter = new TypeORMAdapter(
        this.userRepository,
        this.sessionRepository,
        this.accountRepository,
      );

      console.log('📊 Config values:', {
        secret: this.configService.get('jwt.secret'),
        baseURL: this.configService.get('app.baseURL') || 'http://localhost:3001',
        corsOrigin: this.configService.get('app.corsOrigin') || 'http://localhost:3001',
        nodeEnv: this.configService.get('NODE_ENV'),
      });

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
    
    console.log('✅ BetterAuth initialized successfully');
    } catch (error) {
      console.error('❌ BetterAuth initialization failed:', error);
      throw error;
    }
  }

  getAuthInstance() {
    return this.auth;
  }

  // Méthodes utilitaires pour l'intégration
  async findUserByEmail(email: string): Promise<BetterAuthUser | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserById(id: string): Promise<BetterAuthUser | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUserFromBetterAuth(betterAuthUser: any): Promise<BetterAuthUser> {
    const user = this.userRepository.create({
      id: betterAuthUser.id,
      email: betterAuthUser.email,
      name: betterAuthUser.name,
      image: betterAuthUser.image,
      emailVerified: betterAuthUser.emailVerified,
    });

    return this.userRepository.save(user);
  }

  async updateUserLastLogin(id: string): Promise<void> {
    // Cette méthode peut être implémentée si nécessaire
    // Pour l'instant, better-auth gère les sessions automatiquement
  }
}