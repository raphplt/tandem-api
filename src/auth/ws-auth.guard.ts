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
      const session = await this.betterAuthService.getSession(headers as any);

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
    const headers: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(client.handshake.headers)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'string') {
          headers[key] = value[0];
        }
      } else if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    const authorization =
      this.normalizeAuthorizationHeader(headers.authorization) ??
      this.extractTokenFromHandshake(client);

    if (authorization) {
      headers.authorization = authorization;
    }

    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        sanitizedHeaders[key] = value;
      }
    }

    return sanitizedHeaders;
  }

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const authToken = this.normalizeToken(client.handshake.auth?.token);
    if (authToken) {
      return authToken.startsWith('Bearer ')
        ? authToken
        : `Bearer ${authToken}`;
    }

    const queryToken = this.normalizeToken(client.handshake.query?.token);
    if (queryToken) {
      return `Bearer ${queryToken}`;
    }

    const headerToken = this.normalizeAuthorizationHeader(
      client.handshake.headers?.authorization as string | undefined,
    );

    return headerToken;
  }

  private normalizeAuthorizationHeader(value?: string): string | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
  }

  private normalizeToken(token: unknown): string | undefined {
    if (typeof token === 'string') {
      const trimmed = token.trim();
      return trimmed.length ? trimmed : undefined;
    }

    if (Array.isArray(token)) {
      const candidate = token.find((value) => typeof value === 'string');
      if (typeof candidate === 'string') {
        return this.normalizeToken(candidate);
      }
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
