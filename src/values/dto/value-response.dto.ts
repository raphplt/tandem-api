import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValueCategory } from '../entities/value.entity';

export class ValueResponseDto {
  @ApiProperty({ description: 'Unique identifier of the value' })
  id: string;

  @ApiProperty({ description: 'Name of the value' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the value' })
  description?: string;

  @ApiProperty({ description: 'Category of the value', enum: ValueCategory })
  category: ValueCategory;

  @ApiPropertyOptional({ description: 'Icon or emoji representing the value' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Color associated with the value' })
  color?: string;

  @ApiProperty({ description: 'Indicates if the value is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of profiles that have this value' })
  profileCount: number;

  @ApiProperty({ description: 'Importance score of the value' })
  importanceScore: number;

  @ApiProperty({ description: 'Tags associated with the value' })
  tags: string[];

  @ApiPropertyOptional({ description: 'Additional metadata about the value' })
  metadata?: {
    relatedValues?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
    conflictValues?: string[];
  };

  @ApiProperty({ description: 'Timestamp when the value was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the value was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'Indicates if the value is important' })
  isImportant: boolean;

  @ApiProperty({ description: 'Indicates if the value is core' })
  isCore: boolean;

  @ApiProperty({ description: 'Display name of the value' })
  displayName: string;

  @ApiProperty({ description: 'Searchable text content' })
  searchableText: string;
}
