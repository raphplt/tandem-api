import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class SaveInterestsDraftDto {
  @ApiProperty({ description: 'Identifiant du draft onboarding' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ description: 'Jeton du draft' })
  @IsString()
  @IsNotEmpty()
  draftToken: string;

  @ApiProperty({
    description: 'Liste des slugs intérêts sélectionnés (max 5)',
    example: ['hiking', 'cinema'],
    isArray: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  interestSlugs: string[];
}
