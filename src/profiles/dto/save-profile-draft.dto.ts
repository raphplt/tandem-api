import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '../entities/profile.entity';

export class SaveProfileDraftDto {
  @ApiProperty({ description: 'Identifiant du draft onboarding' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ description: 'Jeton du draft pour authentifier la mise à jour' })
  @IsString()
  @IsNotEmpty()
  draftToken: string;

  @ApiProperty({ description: 'Prénom déclaré' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  firstName: string;

  @ApiProperty({ description: 'Date de naissance (format ISO)', example: '1995-06-15' })
  @IsDateString()
  birthdate: string;

  @ApiProperty({ description: 'Genre', enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Genres recherchés',
    enum: Gender,
    isArray: true,
    example: [Gender.FEMALE, Gender.MALE],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsEnum(Gender, { each: true })
  seeking: Gender[];

  @ApiPropertyOptional({ description: 'Intention principale', maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  intention?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ description: 'Pays' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ description: 'Bio courte (140 chars max)' })
  @IsOptional()
  @IsString()
  @MaxLength(140)
  bio?: string;
}
