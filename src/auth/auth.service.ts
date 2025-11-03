import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { BetterAuthService } from './better-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserRole } from 'src/common/enums/user.enums';
import { OnboardingMergeService } from '../onboarding/onboarding-merge.service';
import { AuthMethodType } from '../users/entities/user-auth-method.entity';

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly betterAuthService: BetterAuthService,
    private readonly onboardingMergeService: OnboardingMergeService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const authInstance = this.betterAuthService.getAuthInstance();

    try {
      const result = await authInstance.api.signUpEmail({
        body: {
          email: registerDto.email,
          password: registerDto.password,
          name: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
        },
      });

      if (!result.user) {
        throw new BadRequestException('Registration failed - user not created');
      }

      let user = await this.ensureLocalUser(result.user, {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      const mergedUser = await this.mergeDraftIfNeeded(registerDto, user);
      if (mergedUser) {
        user = mergedUser;
      }

      return this.buildAuthResponse(user, result.token ?? '');
    } catch (error) {
      if (this.isDuplicateError(error)) {
        throw new ConflictException('User with this email already exists');
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const authInstance = this.betterAuthService.getAuthInstance();

    try {
      const result = await authInstance.api.signInEmail({
        body: {
          email: loginDto.email,
          password: loginDto.password,
        },
      });

      if (!result.user) {
        throw new UnauthorizedException('Invalid credentials');
      }

    const user = await this.ensureLocalUser(result.user);
    await this.updateUserLastLogin(user.id);

    return this.buildAuthResponse(user, result.token ?? '');
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async logout(request: Request): Promise<void> {
    const authInstance = this.betterAuthService.getAuthInstance();
    const headers = request.headers as Record<string, unknown>;
    const userId = (request as any).user?.id as string | undefined;

    try {
      await authInstance.api.signOut({
        headers: headers as any,
      });

      if (userId) {
        await this.updateUserLastLogout(userId);
      }
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }

  async getProfile(headers: Request['headers']): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
  }> {
    const session = await this.betterAuthService.getSession(headers as any);

    if (!session?.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const localUser = await this.userRepository.findOne({
      where: { id: session.user.id },
    });

    const names = this.resolveNames(session.user.name, {
      firstName: localUser?.firstName,
      lastName: localUser?.lastName,
    });

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: localUser?.firstName ?? names.firstName,
      lastName: localUser?.lastName ?? names.lastName,
      roles: localUser?.roles ?? [UserRole.USER],
    };
  }

  async changePassword(body: {
    oldPassword: string;
    newPassword: string;
  }): Promise<void> {
    const authInstance = this.betterAuthService.getAuthInstance();

    try {
      await authInstance.api.changePassword({
        body: {
          currentPassword: body.oldPassword,
          newPassword: body.newPassword,
        },
      });
    } catch (error) {
      throw new BadRequestException('Password change failed');
    }
  }

  async refreshSession(headers: Request['headers']): Promise<AuthResponseDto> {
    const refreshed = await this.betterAuthService.refreshSession(
      headers as any,
    );

    if (!refreshed?.session || !refreshed?.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.ensureLocalUser(refreshed.user);
    await this.updateUserLastLogin(user.id);

    return this.buildAuthResponse(user, refreshed.session.token);
  }

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

  private async ensureLocalUser(
    betterAuthUser: any,
    overrideName?: { firstName?: string; lastName?: string },
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { id: betterAuthUser.id },
    });

    const { firstName, lastName } = this.resolveNames(betterAuthUser.name, {
      firstName: overrideName?.firstName,
      lastName: overrideName?.lastName,
    });

    if (!existingUser) {
      const newUser = this.userRepository.create({
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        firstName,
        lastName,
        roles: [UserRole.USER],
        isActive: true,
      });

      return this.userRepository.save(newUser);
    }

    let shouldPersist = false;

    if (existingUser.email !== betterAuthUser.email) {
      existingUser.email = betterAuthUser.email;
      shouldPersist = true;
    }

    if (firstName && existingUser.firstName !== firstName) {
      existingUser.firstName = firstName;
      shouldPersist = true;
    }

    if (lastName && existingUser.lastName !== lastName) {
      existingUser.lastName = lastName;
      shouldPersist = true;
    }

    return shouldPersist
      ? this.userRepository.save(existingUser)
      : existingUser;
  }

  private async mergeDraftIfNeeded(
    registerDto: RegisterDto,
    user: User,
  ): Promise<User | null> {
    if (!registerDto.draftId || !registerDto.draftToken) {
      return null;
    }

    try {
      const merged = await this.onboardingMergeService.mergeDraft({
        draftId: registerDto.draftId,
        draftToken: registerDto.draftToken,
        authMethod: AuthMethodType.EMAIL,
        identifier: registerDto.email.toLowerCase(),
        email: registerDto.email,
        existingUserId: user.id,
      });

      return merged;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Impossible de fusionner le draft onboarding',
      );
    }
  }

  private buildAuthResponse(user: User, token: string): AuthResponseDto {
    return {
      sessionToken: token,
      expiresIn: SESSION_DURATION_SECONDS,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles ?? [UserRole.USER],
      },
    };
  }

  private resolveNames(
    fullName?: string | null,
    override?: { firstName?: string; lastName?: string },
  ): { firstName: string; lastName: string } {
    if (override?.firstName || override?.lastName) {
      return {
        firstName: override.firstName ?? '',
        lastName: override.lastName ?? '',
      };
    }

    if (!fullName) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() ?? '';
    const lastName = parts.join(' ');

    return { firstName, lastName };
  }

  private isDuplicateError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const message = (error as any).message?.toLowerCase?.() ?? '';

    return message.includes('already') || message.includes('duplicate');
  }
}
