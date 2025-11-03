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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestDto } from './dto/update-interest.dto';
import { InterestResponseDto } from './dto/interest-response.dto';
import { InterestCategory } from './entities/interest.entity';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public, Roles } from '../auth/decorators';

@ApiTags('interests')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new interest' })
  @ApiResponse({
    status: 201,
    description: 'Interest created successfully',
    type: InterestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Interest already exists' })
  async create(
    @Body() createInterestDto: CreateInterestDto,
  ): Promise<InterestResponseDto> {
    return this.interestsService.create(createInterestDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create multiple interests at once' })
  @ApiResponse({
    status: 201,
    description: 'Interests created successfully',
    type: [InterestResponseDto],
  })
  async bulkCreate(
    @Body() interests: CreateInterestDto[],
  ): Promise<InterestResponseDto[]> {
    return this.interestsService.bulkCreate(interests);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all interests' })
  @ApiResponse({
    status: 200,
    description: 'List of all interests',
    type: [InterestResponseDto],
  })
  async findAll(): Promise<InterestResponseDto[]> {
    return this.interestsService.findAll();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get interests statistics' })
  @ApiResponse({ status: 200, description: 'Interests statistics' })
  async getStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<InterestCategory, number>;
    mostPopular: string[];
    averagePopularity: number;
  }> {
    return this.interestsService.getStats();
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular interests' })
  @ApiResponse({
    status: 200,
    description: 'List of popular interests',
    type: [InterestResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of interests to return',
    type: Number,
  })
  async findPopular(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<InterestResponseDto[]> {
    return this.interestsService.findPopular(limit);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending interests' })
  @ApiResponse({
    status: 200,
    description: 'List of trending interests',
    type: [InterestResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of interests to return',
    type: Number,
  })
  async findTrending(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<InterestResponseDto[]> {
    return this.interestsService.findTrending(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search interests by query' })
  @ApiResponse({
    status: 200,
    description: 'List of matching interests',
    type: [InterestResponseDto],
  })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    type: Number,
  })
  async searchInterests(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<InterestResponseDto[]> {
    return this.interestsService.searchInterests(query, limit);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get interests by category' })
  @ApiResponse({
    status: 200,
    description: 'List of interests in category',
    type: [InterestResponseDto],
  })
  async findByCategory(
    @Param('category') category: InterestCategory,
  ): Promise<InterestResponseDto[]> {
    return this.interestsService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific interest' })
  @ApiResponse({
    status: 200,
    description: 'Interest found',
    type: InterestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  async findOne(@Param('id') id: string): Promise<InterestResponseDto> {
    return this.interestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update an interest' })
  @ApiResponse({
    status: 200,
    description: 'Interest updated successfully',
    type: InterestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  @ApiResponse({ status: 409, description: 'Interest name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateInterestDto: UpdateInterestDto,
  ): Promise<InterestResponseDto> {
    return this.interestsService.update(id, updateInterestDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete an interest' })
  @ApiResponse({ status: 200, description: 'Interest deleted successfully' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.interestsService.remove(id);
  }

  @Delete(':id/hard')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Hard delete an interest (admin only)' })
  @ApiResponse({ status: 200, description: 'Interest permanently deleted' })
  @ApiResponse({ status: 404, description: 'Interest not found' })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.interestsService.hardDelete(id);
  }
}
