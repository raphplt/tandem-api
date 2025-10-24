import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { InterestCategory } from '../entities/interest.entity';

export class CreateInterestDto {
  @ApiProperty({ description: 'Name of the interest' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the interest' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Category of the interest',
    enum: InterestCategory,
  })
  @IsEnum(InterestCategory)
  category: InterestCategory;

  @ApiPropertyOptional({
    description: 'Icon or emoji representing the interest',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ description: 'Color associated with the interest' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the interest' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata about the interest',
  })
  @IsOptional()
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };
}
