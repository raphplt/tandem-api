import {
  IsEmail,
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user.enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'User date of birth',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'User roles',
    example: ['user'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['user', 'admin', 'moderator'], {
    each: true,
    message: 'Invalid role provided',
  })
  roles?: UserRole[];
}
