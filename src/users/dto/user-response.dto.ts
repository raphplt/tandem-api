import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user.enums';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
    nullable: true,
  })
  email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
    nullable: true,
  })
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
    nullable: true,
  })
  lastName?: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'User date of birth',
    example: '1990-01-01T00:00:00.000Z',
    required: false,
  })
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'User roles',
    example: [UserRole.USER],
    type: [String],
  })
  roles: UserRole[];

  @ApiProperty({
    description: 'User active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-01T12:00:00.000Z',
    required: false,
  })
  lastLoginAt?: Date;

  @ApiProperty({
    description: 'Last logout timestamp',
    example: '2024-01-01T18:00:00.000Z',
    required: false,
  })
  lastLogoutAt?: Date;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;
}
