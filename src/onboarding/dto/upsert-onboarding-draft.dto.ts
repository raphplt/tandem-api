import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertOnboardingDraftDto {
  @ApiProperty({
    description: 'Identifiant unique du device pour lier le draft côté serveur',
    example: 'device-123456',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceId: string;

  @ApiPropertyOptional({
    description:
      'Payload partiel représentant la progression de l’onboarding (merge côté serveur)',
    example: { step: 'firstName', data: { firstName: 'Alice' } },
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Jeton nécessaire pour mettre à jour un draft existant (fourni lors de la création)',
  })
  @IsOptional()
  @IsString()
  draftToken?: string;
}
