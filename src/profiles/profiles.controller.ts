import {
  Body,
  Controller,
  Get,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { SaveProfileDraftDto } from './dto/save-profile-draft.dto';
import { SavePreferencesDraftDto } from './dto/save-preferences-draft.dto';
import { SaveInterestsDraftDto } from './dto/save-interests-draft.dto';
import { UpsertOnboardingDraftResponseDto } from '../onboarding/dto/upsert-onboarding-draft-response.dto';
import { ProfileResponseDto, ProfilePhotoResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { SetPhotosDto } from './dto/set-photos.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Profiles')
@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('profiles/draft')
  @Public()
  @ApiOperation({ summary: 'Enregistrer les informations principales du profil dans le draft' })
  @ApiResponse({
    status: 200,
    description: 'Draft mis à jour',
    type: UpsertOnboardingDraftResponseDto,
  })
  saveProfileDraft(
    @Body() dto: SaveProfileDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    return this.profilesService.saveProfileDraft(dto);
  }

  @Post('profiles/draft/preferences')
  @Public()
  @ApiOperation({ summary: 'Enregistrer les préférences (âge/distance) dans le draft' })
  @ApiResponse({
    status: 200,
    description: 'Draft mis à jour',
    type: UpsertOnboardingDraftResponseDto,
  })
  savePreferencesDraft(
    @Body() dto: SavePreferencesDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    return this.profilesService.savePreferencesDraft(dto);
  }

  @Post('profiles/draft/interests')
  @Public()
  @ApiOperation({ summary: 'Enregistrer les centres d’intérêt dans le draft' })
  @ApiResponse({
    status: 200,
    description: 'Draft mis à jour',
    type: UpsertOnboardingDraftResponseDto,
  })
  saveInterestsDraft(
    @Body() dto: SaveInterestsDraftDto,
  ): Promise<UpsertOnboardingDraftResponseDto> {
    return this.profilesService.saveInterestsDraft(dto);
  }

  @Get('users/me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer le profil complet de l’utilisateur connecté' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  getMyProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.profilesService.getCurrentUserProfile(user.id);
  }

  @Put('users/me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les informations principales du profil (post-auth)' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateCurrentUserProfile(user.id, dto);
  }

  @Put('users/me/preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les préférences de recherche (post-auth)' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  updateMyPreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateCurrentUserPreferences(user.id, dto);
  }

  @Post('users/me/photos')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Définir l’ordre des photos (1 à 3)' })
  @ApiResponse({ status: 200, type: [ProfilePhotoResponseDto] })
  setMyPhotos(
    @CurrentUser() user: User,
    @Body() dto: SetPhotosDto,
  ): Promise<ProfilePhotoResponseDto[]> {
    return this.profilesService.setUserPhotos(user.id, dto);
  }
}
