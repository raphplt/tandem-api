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
import { ValuesService } from './values.service';
import { CreateValueDto } from './dto/create-value.dto';
import { UpdateValueDto } from './dto/update-value.dto';
import { ValueResponseDto } from './dto/value-response.dto';
import { ValueCategory } from './entities/value.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators';

@ApiTags('values')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('values')
export class ValuesController {
  constructor(private readonly valuesService: ValuesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new value' })
  @ApiResponse({
    status: 201,
    description: 'Value created successfully',
    type: ValueResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Value already exists' })
  async create(
    @Body() createValueDto: CreateValueDto,
  ): Promise<ValueResponseDto> {
    return this.valuesService.create(createValueDto);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create multiple values at once' })
  @ApiResponse({
    status: 201,
    description: 'Values created successfully',
    type: [ValueResponseDto],
  })
  async bulkCreate(
    @Body() values: CreateValueDto[],
  ): Promise<ValueResponseDto[]> {
    return this.valuesService.bulkCreate(values);
  }

  @Get()
  @ApiOperation({ summary: 'Get all values' })
  @ApiResponse({
    status: 200,
    description: 'List of all values',
    type: [ValueResponseDto],
  })
  async findAll(): Promise<ValueResponseDto[]> {
    return this.valuesService.findAll();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get values statistics' })
  @ApiResponse({ status: 200, description: 'Values statistics' })
  async getStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<ValueCategory, number>;
    mostImportant: string[];
    averageImportance: number;
  }> {
    return this.valuesService.getStats();
  }

  @Get('important')
  @ApiOperation({ summary: 'Get important values' })
  @ApiResponse({
    status: 200,
    description: 'List of important values',
    type: [ValueResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of values to return',
    type: Number,
  })
  async findImportant(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<ValueResponseDto[]> {
    return this.valuesService.findImportant(limit);
  }

  @Get('core')
  @ApiOperation({ summary: 'Get core values' })
  @ApiResponse({
    status: 200,
    description: 'List of core values',
    type: [ValueResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of values to return',
    type: Number,
  })
  async findCore(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<ValueResponseDto[]> {
    return this.valuesService.findCore(limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search values by query' })
  @ApiResponse({
    status: 200,
    description: 'List of matching values',
    type: [ValueResponseDto],
  })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    type: Number,
  })
  async searchValues(
    @Query('q') query: string,
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<ValueResponseDto[]> {
    return this.valuesService.searchValues(query, limit);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get values by category' })
  @ApiResponse({
    status: 200,
    description: 'List of values in category',
    type: [ValueResponseDto],
  })
  async findByCategory(
    @Param('category') category: ValueCategory,
  ): Promise<ValueResponseDto[]> {
    return this.valuesService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific value' })
  @ApiResponse({
    status: 200,
    description: 'Value found',
    type: ValueResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Value not found' })
  async findOne(@Param('id') id: string): Promise<ValueResponseDto> {
    return this.valuesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update a value' })
  @ApiResponse({
    status: 200,
    description: 'Value updated successfully',
    type: ValueResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Value not found' })
  @ApiResponse({ status: 409, description: 'Value name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateValueDto: UpdateValueDto,
  ): Promise<ValueResponseDto> {
    return this.valuesService.update(id, updateValueDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete a value' })
  @ApiResponse({ status: 200, description: 'Value deleted successfully' })
  @ApiResponse({ status: 404, description: 'Value not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.valuesService.remove(id);
  }

  @Delete(':id/hard')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Hard delete a value (admin only)' })
  @ApiResponse({ status: 200, description: 'Value permanently deleted' })
  @ApiResponse({ status: 404, description: 'Value not found' })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.valuesService.hardDelete(id);
  }
}
