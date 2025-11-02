import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export enum MediaScope {
  PROFILE_PHOTO = 'photos/profile',
}

export class PresignMediaDto {
  @ApiProperty({
    description: 'Type de contenu qui sera uploadé (doit être une image)',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\//, {
    message: 'Seuls les uploads image/* sont supportés pour le moment',
  })
  contentType: string;

  @ApiPropertyOptional({
    description: 'Scope fonctionnel de la ressource',
    enum: MediaScope,
    default: MediaScope.PROFILE_PHOTO,
  })
  @IsOptional()
  @IsEnum(MediaScope)
  scope?: MediaScope;

  @ApiPropertyOptional({
    description: 'Identifiant du draft onboarding lorsque non authentifié',
  })
  @IsOptional()
  @IsUUID()
  draftId?: string;

  @ApiPropertyOptional({
    description: 'Jeton du draft correspondant (obligatoire si draftId présent)',
  })
  @IsOptional()
  @IsString()
  draftToken?: string;
}
