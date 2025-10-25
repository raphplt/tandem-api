import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BetterAuthService } from './better-auth.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private betterAuthService: BetterAuthService,
  ) {}

  // Méthodes utilitaires pour l'intégration avec votre système existant
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }

  async updateUserLastLogout(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogoutAt: new Date() });
  }

  async createUserFromBetterAuth(betterAuthUser: any): Promise<User> {
    const [firstName, lastName] = betterAuthUser.name?.split(' ') || ['', ''];
    
    const user = this.userRepository.create({
      id: betterAuthUser.id,
      email: betterAuthUser.email,
      firstName,
      lastName,
      password: '', // Le mot de passe est géré par better-auth
      roles: ['user'],
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async syncUserWithBetterAuth(userId: string, betterAuthUser: any): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      await this.userRepository.update(userId, {
        email: betterAuthUser.email,
        firstName: betterAuthUser.name?.split(' ')[0] || user.firstName,
        lastName: betterAuthUser.name?.split(' ')[1] || user.lastName,
      });
    }
  }
}