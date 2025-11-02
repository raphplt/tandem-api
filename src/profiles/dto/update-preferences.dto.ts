import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Âge minimum recherché' })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(90)
  ageMin?: number;

  @ApiPropertyOptional({ description: 'Âge maximum recherché' })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(90)
  ageMax?: number;

  @ApiPropertyOptional({ description: 'Distance maximale en km' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  distanceKm?: number;
}
