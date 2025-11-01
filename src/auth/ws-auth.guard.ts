import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Socket } from 'socket.io';
import { BetterAuthService } from './better-auth.service';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserRole } from 'src/common/enums/user.enums';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      id: string;
      email?: string | null;
      firstName?: string;
      lastName?: string;
      roles?: UserRole[];
    };
  };
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly betterAuthService: BetterAuthService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    if (client.data?.user) {
      return true;
    }

    const headers = this.collectHeaders(client);

    try {
      const session = await this.betterAuthService.getSession(
        headers as any,
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

      client.data = client.data || {};
      client.data.user = {
        id: session.user.id,
        email: session.user.email ?? undefined,
        firstName,
        lastName,
        roles: localUser?.roles ?? [UserRole.USER],
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('WebSocket authentication failed');
    }
  }

  private collectHeaders(client: Socket): Record<string, string> {
    const headers: Record<string, string> = {};

    // Collecter les headers du handshake (dont Authorization si fourni)
    // En mode Bearer-only, l'auth repose sur le header Authorization
    for (const [key, value] of Object.entries(client.handshake.headers)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'string') {
          headers[key] = value[0];
        }
      } else if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    return headers;
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
