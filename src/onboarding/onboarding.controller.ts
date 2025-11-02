import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { UpsertOnboardingDraftDto } from './dto/upsert-onboarding-draft.dto';
import { UpsertOnboardingDraftResponseDto } from './dto/upsert-onboarding-draft-response.dto';
import { OnboardingDraftResponseDto } from './dto/onboarding-draft-response.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Onboarding')
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('drafts')
  @Public()
  @ApiOperation({
    summary: 'Créer ou mettre à jour un draft onboarding lié à un device',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft créé ou mis à jour',
    type: UpsertOnboardingDraftResponseDto,
  })
  async upsertDraft(
    @Body() dto: UpsertOnboardingDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    const { draft, draftToken } = await this.onboardingService.upsertDraft(dto);
    return UpsertOnboardingDraftResponseDto.fromEntity(draft, draftToken);
  }

  @Get('drafts/:deviceId')
  @Public()
  @ApiOperation({
    summary: 'Récupérer un draft onboarding par device + token',
  })
  @ApiHeader({
    name: 'x-draft-token',
    required: false,
    description:
      'Jeton de draft retourné lors de la création (peut aussi être passé en query param)',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft trouvé',
    type: OnboardingDraftResponseDto,
  })
  async getDraft(
    @Param('deviceId') deviceId: string,
    @Headers('x-draft-token') tokenHeader?: string,
    @Query('draftToken') tokenQuery?: string,
  ): Promise<OnboardingDraftResponseDto> {
    const token = tokenHeader ?? tokenQuery;

    if (!token) {
      throw new UnauthorizedException('Le draftToken est requis');
    }

    const draft = await this.onboardingService.getDraft(deviceId, token);
    return OnboardingDraftResponseDto.fromEntity(draft);
  }
}
