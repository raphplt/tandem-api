import { ApiProperty } from '@nestjs/swagger';
import { OnboardingDraft } from '../entities/onboarding-draft.entity';

export class OnboardingDraftResponseDto {
  @ApiProperty({ description: 'Identifiant du draft' })
  draftId: string;

  @ApiProperty({ description: 'Identifiant device associé' })
  deviceId: string;

  @ApiProperty({
    description: 'Payload JSON cumulant les informations de l’onboarding',
    type: Object,
  })
  payload: Record<string, unknown>;

  @ApiProperty({
    description: 'Date d’expiration du draft (UTC)',
    type: String,
    format: 'date-time',
  })
  expiresAt: Date;

  static fromEntity(entity: OnboardingDraft): OnboardingDraftResponseDto {
    return {
      draftId: entity.id,
      deviceId: entity.deviceId,
      payload: (entity.payloadJson ?? {}) as Record<string, unknown>,
      expiresAt: entity.expiresAt,
    };
  }
}
