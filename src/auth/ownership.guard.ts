import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if the user is accessing their own resource
    const userId = params.id || params.userId;
    if (userId && userId !== user.id) {
      throw new ForbiddenException(
        'Access denied: You can only access your own resources',
      );
    }

    return true;
  }
}
