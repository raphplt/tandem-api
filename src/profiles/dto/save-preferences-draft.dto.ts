import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SavePreferencesDraftDto {
  @ApiProperty({ description: 'Identifiant du draft onboarding' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ description: 'Jeton du draft' })
  @IsString()
  @IsNotEmpty()
  draftToken: string;

  @ApiProperty({ description: 'Âge minimum recherché', example: 25 })
  @IsInt()
  @Min(18)
  @Max(90)
  ageMin: number;

  @ApiProperty({ description: 'Âge maximum recherché', example: 35 })
  @IsInt()
  @Min(18)
  @Max(90)
  ageMax: number;

  @ApiProperty({ description: 'Distance max en km', example: 30 })
  @IsInt()
  @Min(1)
  @Max(500)
  distanceKm: number;
}
