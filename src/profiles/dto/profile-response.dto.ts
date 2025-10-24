import { ApiProperty } from '@nestjs/swagger';
import { Gender, ProfileVisibility } from '../entities/profile.entity';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Profile unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'User bio/description',
    example: 'I love hiking and reading books',
  })
  bio: string;

  @ApiProperty({
    description: 'City where the user lives',
    example: 'Paris',
  })
  city: string;

  @ApiProperty({
    description: 'Country where the user lives',
    example: 'France',
    required: false,
  })
  country?: string;

  @ApiProperty({
    description: 'User age',
    example: 25,
  })
  age: number;

  @ApiProperty({
    description: 'User gender',
    enum: Gender,
    example: Gender.MALE,
  })
  gender: Gender;

  @ApiProperty({
    description: 'Genders the user is interested in',
    enum: Gender,
    isArray: true,
    example: [Gender.FEMALE, Gender.NON_BINARY],
  })
  interestedIn: Gender[];

  @ApiProperty({
    description: 'Profile photo URL',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  photoUrl?: string;

  @ApiProperty({
    description: 'Profile visibility',
    enum: ProfileVisibility,
    example: ProfileVisibility.PUBLIC,
  })
  visibility: ProfileVisibility;

  @ApiProperty({
    description: 'Profile active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Profile completion status',
    example: true,
  })
  isComplete: boolean;

  @ApiProperty({
    description: 'Profile verification status',
    example: false,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'User preferences',
    example: {
      ageRange: { min: 20, max: 35 },
      maxDistance: 25,
      interests: ['hiking', 'reading'],
      values: ['honesty', 'kindness'],
    },
    required: false,
  })
  preferences?: {
    ageRange?: { min: number; max: number };
    maxDistance?: number;
    interests?: string[];
    values?: string[];
  };

  @ApiProperty({
    description: 'Social media links',
    example: {
      instagram: 'https://instagram.com/username',
      twitter: 'https://twitter.com/username',
      linkedin: 'https://linkedin.com/in/username',
      website: 'https://example.com',
    },
    required: false,
  })
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };

  @ApiProperty({
    description: 'User location coordinates',
    example: {
      latitude: 48.8566,
      longitude: 2.3522,
      city: 'Paris',
      country: 'France',
    },
    required: false,
  })
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };

  @ApiProperty({
    description: 'Profile view count',
    example: 150,
  })
  viewCount: number;

  @ApiProperty({
    description: 'Profile like count',
    example: 25,
  })
  likeCount: number;

  @ApiProperty({
    description: 'Profile match count',
    example: 5,
  })
  matchCount: number;

  @ApiProperty({
    description: 'Profile creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Profile last update timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether profile is complete',
    example: true,
  })
  isProfileComplete: boolean;

  @ApiProperty({
    description: 'Age range preference',
    example: { min: 20, max: 35 },
  })
  ageRange: { min: number; max: number };

  @ApiProperty({
    description: 'Maximum distance preference',
    example: 25,
  })
  maxDistance: number;
}
