import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Date of birth of the user',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Onboarding draft identifier to merge after registration',
  })
  @IsOptional()
  @IsString()
  draftId?: string;

  @ApiPropertyOptional({
    description: 'Draft token proving ownership of the onboarding draft',
  })
  @IsOptional()
  @IsString()
  draftToken?: string;
}
