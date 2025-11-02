import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  IsUrl,
} from 'class-validator';

export class SetPhotosDto {
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
