import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';

export class SavePhotosDraftDto {
  @ApiProperty({ description: 'Identifiant du draft onboarding' })
  @IsUUID()
  draftId: string;

  @ApiProperty({ description: 'Jeton du draft' })
  @IsString()
  @IsNotEmpty()
  draftToken: string;

  @ApiProperty({
    description: 'Liste ordonnée des URLs photos (max 3)',
    isArray: true,
    example: ['https://cdn.example/1.jpg'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  photos: string[];
}
