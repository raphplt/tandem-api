import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../entities/profile.entity';

export class ProfilePreferencesResponseDto {
  @ApiProperty()
  ageMin: number;

  @ApiProperty()
  ageMax: number;

  @ApiProperty()
  distanceKm: number;
}

export class ProfilePhotoResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  position: number;
}

export class ProfileResponseDto {
  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  birthdate?: string;

  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @ApiProperty({ enum: Gender, isArray: true })
  seeking: Gender[];

  @ApiPropertyOptional()
  intention?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date;

  @ApiProperty({ type: ProfilePreferencesResponseDto })
  preferences: ProfilePreferencesResponseDto;

  @ApiProperty({ isArray: true })
  interests: string[];

  @ApiProperty({ type: ProfilePhotoResponseDto, isArray: true })
  photos: ProfilePhotoResponseDto[];
}
