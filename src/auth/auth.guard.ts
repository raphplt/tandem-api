import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BetterAuthService } from './better-auth.service';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserRole } from 'src/common/enums/user.enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private betterAuthService: BetterAuthService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      const session = await this.betterAuthService.getSession(
        request.headers as any,
      );

      if (!session?.user) {
        throw new UnauthorizedException('No valid session found');
      }

      const localUser = await this.authService.findUserById(session.user.id);
      const [firstName, lastName] = this.extractNames(
        session.user.name,
        localUser?.firstName,
        localUser?.lastName,
      );

      request.user = {
        id: session.user.id,
        email: session.user.email,
        firstName,
        lastName,
        roles: localUser?.roles ?? [UserRole.USER],
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractNames(
    fullName?: string | null,
    fallbackFirstName?: string,
    fallbackLastName?: string,
  ): [string, string] {
    if (fallbackFirstName || fallbackLastName) {
      return [fallbackFirstName ?? '', fallbackLastName ?? ''];
    }

    if (!fullName) {
      return ['', ''];
    }

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() ?? '';
    const lastName = parts.join(' ');

    return [firstName, lastName];
  }
}
