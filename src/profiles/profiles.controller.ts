import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { Roles } from '../auth/decorators';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Gender } from './entities/profile.entity';

@ApiTags('profiles')
@Controller('profiles')
  @UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Profile already exists for this user',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(
    @Body() createProfileDto: CreateProfileDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.create(currentUser.id, createProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profiles' })
  @ApiResponse({
    status: 200,
    description: 'List of all profiles',
    type: [ProfileResponseDto],
  })
  async findAll(): Promise<ProfileResponseDto[]> {
    return this.profilesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search profiles' })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    example: 'hiking',
    required: false,
  })
  @ApiQuery({
    name: 'gender',
    description: 'Gender filter',
    enum: Gender,
    required: false,
  })
  @ApiQuery({
    name: 'minAge',
    description: 'Minimum age',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'maxAge',
    description: 'Maximum age',
    example: 35,
    required: false,
  })
  @ApiQuery({
    name: 'city',
    description: 'City filter',
    example: 'Paris',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [ProfileResponseDto],
  })
  async searchProfiles(
    @Query('q') query?: string,
    @Query('gender') gender?: Gender,
    @Query('minAge') minAge?: number,
    @Query('maxAge') maxAge?: number,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
  ): Promise<ProfileResponseDto[]> {
    const ageRange =
      minAge && maxAge ? { min: minAge, max: maxAge } : undefined;
    return this.profilesService.searchProfiles(
      query || '',
      gender,
      ageRange,
      city,
      limit,
    );
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby profiles' })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude coordinate',
    example: 48.8566,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude coordinate',
    example: 2.3522,
  })
  @ApiQuery({
    name: 'maxDistance',
    description: 'Maximum distance in kilometers',
    example: 25,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    example: 20,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby profiles',
    type: [ProfileResponseDto],
  })
  async findNearbyProfiles(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('maxDistance') maxDistance: number,
    @Query('limit') limit?: number,
  ): Promise<ProfileResponseDto[]> {
    return this.profilesService.findNearbyProfiles(
      latitude,
      longitude,
      maxDistance,
      limit,
    );
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getMyProfile(
    @CurrentUser() currentUser: User,
  ): Promise<ProfileResponseDto | null> {
    return this.profilesService.findByUserId(currentUser.id);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'Profile found',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own profile',
  })
  async findOne(@Param('id') id: string): Promise<ProfileResponseDto> {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own profile',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.update(id, updateProfileDto, currentUser.id);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete profile (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'Profile deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete own profile',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.profilesService.remove(id, currentUser.id);
  }

  @Patch(':id/verify')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Verify profile (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Profile verified successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async verifyProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
    return this.profilesService.verifyProfile(id);
  }

  @Delete(':id/hard')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete profile (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'Profile permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.profilesService.hardDelete(id);
  }
}
