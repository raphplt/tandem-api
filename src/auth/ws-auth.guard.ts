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
      const authInstance = this.betterAuthService.getAuthInstance();
      const session = await authInstance.api.getSession({
        headers: headers as any,
      });

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

    for (const [key, value] of Object.entries(client.handshake.headers)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'string') {
          headers[key] = value[0];
        }
      } else if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    if (!headers.authorization) {
      const token = this.extractToken(client);
      if (token) {
        headers.authorization = token.startsWith('Bearer ')
          ? token
          : `Bearer ${token}`;
      }
    }

    return headers;
  }

  private extractToken(client: Socket): string | undefined {
    const authHeader = client.handshake.headers['authorization'];

    if (typeof authHeader === 'string' && authHeader.length > 0) {
      return authHeader;
    }

    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    if (Array.isArray(queryToken) && queryToken.length > 0) {
      const first = queryToken[0];
      return typeof first === 'string' ? first : undefined;
    }

    return undefined;
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
