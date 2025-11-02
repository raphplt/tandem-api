import { ApiProperty } from '@nestjs/swagger';
import { OnboardingDraft } from '../entities/onboarding-draft.entity';
import { OnboardingDraftResponseDto } from './onboarding-draft-response.dto';

export class UpsertOnboardingDraftResponseDto {
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

  @ApiProperty({
    description:
      'Jeton à stocker côté client pour authentifier les updates du draft',
  })
  draftToken: string;

  static fromEntity(
    entity: OnboardingDraft,
    draftToken: string,
  ): UpsertOnboardingDraftResponseDto {
    return {
      ...OnboardingDraftResponseDto.fromEntity(entity),
      draftToken,
    };
  }
}
