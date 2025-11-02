import { ApiProperty } from '@nestjs/swagger';

export class PresignMediaResponseDto {
  @ApiProperty({ description: 'URL presignée pour effectuer le PUT vers R2' })
  url: string;

  @ApiProperty({ description: 'Clé S3/R2 générée pour le fichier' })
  key: string;

  @ApiProperty({ description: 'URL publique (si exposée via CDN)', nullable: true })
  publicUrl?: string;

  @ApiProperty({ description: 'Durée de validité du lien (en secondes)' })
  expiresIn: number;

  static create(params: {
    url: string;
    key: string;
    publicUrl?: string;
    expiresIn: number;
  }): PresignMediaResponseDto {
    return {
      url: params.url,
      key: params.key,
      publicUrl: params.publicUrl,
      expiresIn: params.expiresIn,
    };
  }
}
