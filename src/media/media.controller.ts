import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import {
  MediaScope,
  PresignMediaDto,
} from './dto/presign-media.dto';
import { PresignMediaResponseDto } from './dto/presign-media-response.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OnboardingService } from '../onboarding/onboarding.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly onboardingService: OnboardingService,
  ) {}

  @Post('presign')
  @Public()
  @ApiOperation({
    summary: 'Générer une URL presignée pour uploader une photo vers Cloudflare R2',
  })
  @ApiResponse({
    status: 200,
    description: 'Lien presigné généré',
    type: PresignMediaResponseDto,
  })
  async presignMedia(
    @Body() dto: PresignMediaDto,
    @CurrentUser() currentUser?: User,
  ): Promise<PresignMediaResponseDto> {
    let userId: string | undefined;
    let draftId: string | undefined;

    if (currentUser?.id) {
      userId = currentUser.id;
    } else if (dto.draftId && dto.draftToken) {
      const draft = await this.onboardingService.assertDraftById(
        dto.draftId,
        dto.draftToken,
      );
      draftId = draft.id;
    } else {
      throw new UnauthorizedException(
        'Authentification requise : user connecté ou couple draftId/draftToken',
      );
    }

    const result = await this.mediaService.createPresignedPutUrl({
      contentType: dto.contentType,
      scope: dto.scope ?? MediaScope.PROFILE_PHOTO,
      userId,
      draftId,
    });

    return PresignMediaResponseDto.create(result);
  }
}
