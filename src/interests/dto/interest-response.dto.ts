import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterestCategory } from '../entities/interest.entity';

export class InterestResponseDto {
  @ApiProperty({ description: 'Unique identifier of the interest' })
  id: string;

  @ApiProperty({ description: 'Name of the interest' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the interest' })
  description?: string;

  @ApiProperty({ description: 'Category of the interest', enum: InterestCategory })
  category: InterestCategory;

  @ApiPropertyOptional({ description: 'Icon or emoji representing the interest' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Color associated with the interest' })
  color?: string;

  @ApiProperty({ description: 'Indicates if the interest is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of profiles that have this interest' })
  profileCount: number;

  @ApiProperty({ description: 'Popularity score of the interest' })
  popularityScore: number;

  @ApiProperty({ description: 'Tags associated with the interest' })
  tags: string[];

  @ApiPropertyOptional({ description: 'Additional metadata about the interest' })
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };

  @ApiProperty({ description: 'Timestamp when the interest was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the interest was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'Indicates if the interest is popular' })
  isPopular: boolean;

  @ApiProperty({ description: 'Indicates if the interest is trending' })
  isTrending: boolean;

  @ApiProperty({ description: 'Display name of the interest' })
  displayName: string;

  @ApiProperty({ description: 'Searchable text content' })
  searchableText: string;
}
