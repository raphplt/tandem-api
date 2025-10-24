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
import { ValueCategory } from '../entities/value.entity';

export class CreateValueDto {
  @ApiProperty({ description: 'Name of the value' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the value' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Category of the value', enum: ValueCategory })
  @IsEnum(ValueCategory)
  category: ValueCategory;

  @ApiPropertyOptional({ description: 'Icon or emoji representing the value' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ description: 'Color associated with the value' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: 'Tags associated with the value' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata about the value' })
  @IsOptional()
  metadata?: {
    relatedValues?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
    conflictValues?: string[];
  };
}
