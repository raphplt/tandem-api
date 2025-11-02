import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user.enums';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Better Auth session token to use as Bearer token',
    example: 'session-opaque-token',
  })
  sessionToken: string;

  @ApiProperty({
    description: 'Session token expiration time in seconds',
    example: 604800,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      email: { type: 'string', example: 'user@example.com', nullable: true },
      firstName: { type: 'string', example: 'John', nullable: true },
      lastName: { type: 'string', example: 'Doe', nullable: true },
      roles: {
        type: 'array',
        items: { type: 'string' },
        example: [UserRole.USER],
      },
    },
  })
  user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
  };
}
