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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { Roles } from '../auth/decorators';
import { CurrentUser } from '../auth/decorators';
import { AvailabilityStatus } from './entities/availability.entity';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new availability record' })
  @ApiResponse({
    status: 201,
    description: 'Availability created successfully',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description: 'Availability already exists for this date',
  })
  async create(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.create(createAvailabilityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all availability records' })
  @ApiResponse({
    status: 200,
    description: 'List of all availability records',
    type: [AvailabilityResponseDto],
  })
  async findAll(): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: "Get current user's availability" })
  @ApiResponse({
    status: 200,
    description: "Current user's availability",
    type: AvailabilityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No availability found' })
  async getMyAvailability(
    @CurrentUser() user: any,
  ): Promise<AvailabilityResponseDto | null> {
    return this.availabilityService.getCurrentAvailability(user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get availability records for a specific user' })
  @ApiResponse({
    status: 200,
    description: "User's availability records",
    type: [AvailabilityResponseDto],
  })
  async findByUserId(
    @Param('userId') userId: string,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.findByUserId(userId);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Get availability records for a specific date' })
  @ApiResponse({
    status: 200,
    description: 'Availability records for the date',
    type: [AvailabilityResponseDto],
  })
  async findByDate(
    @Param('date') date: string,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.findByDate(date);
  }

  @Get('queue')
  @ApiOperation({ summary: 'Get users currently in the matching queue' })
  @ApiResponse({
    status: 200,
    description: 'List of queued users',
    type: [AvailabilityResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of users to return',
    type: Number,
  })
  async getQueuedUsers(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.getQueuedUsers(limit);
  }

  @Get('online')
  @ApiOperation({ summary: 'Get currently online users' })
  @ApiResponse({
    status: 200,
    description: 'List of online users',
    type: [AvailabilityResponseDto],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of users to return',
    type: Number,
  })
  async getOnlineUsers(
    @Query('limit', ParseIntPipe) limit?: number,
  ): Promise<AvailabilityResponseDto[]> {
    return this.availabilityService.getOnlineUsers(limit);
  }

  @Get('stats/queue')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats(): Promise<{
    totalQueued: number;
    onlineQueued: number;
    averageWaitTime: number;
    oldestInQueue: number;
  }> {
    return this.availabilityService.getQueueStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific availability record' })
  @ApiResponse({
    status: 200,
    description: 'Availability record found',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async findOne(@Param('id') id: string): Promise<AvailabilityResponseDto> {
    return this.availabilityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Update an availability record' })
  @ApiResponse({
    status: 200,
    description: 'Availability updated successfully',
    type: AvailabilityResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  @ApiResponse({
    status: 403,
    description: "Forbidden - cannot update other user's availability",
  })
  async update(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
    @CurrentUser() user: any,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.update(id, updateAvailabilityDto, user.id);
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send heartbeat to maintain online status' })
  @ApiResponse({
    status: 200,
    description: 'Heartbeat received',
    type: AvailabilityResponseDto,
  })
  async sendHeartbeat(
    @CurrentUser() user: any,
    @Body() metadata?: any,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.sendHeartbeat(user.id, metadata);
  }

  @Post('queue/join')
  @ApiOperation({ summary: 'Join the matching queue' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined queue',
    type: AvailabilityResponseDto,
  })
  async joinQueue(
    @CurrentUser() user: any,
    @Body() preferences?: any,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.joinQueue(user.id, preferences);
  }

  @Post('queue/leave')
  @ApiOperation({ summary: 'Leave the matching queue' })
  @ApiResponse({
    status: 200,
    description: 'Successfully left queue',
    type: AvailabilityResponseDto,
  })
  async leaveQueue(@CurrentUser() user: any): Promise<AvailabilityResponseDto> {
    return this.availabilityService.leaveQueue(user.id);
  }

  @Post('status/matched')
  @ApiOperation({ summary: 'Mark user as matched' })
  @ApiResponse({
    status: 200,
    description: 'Status updated to matched',
    type: AvailabilityResponseDto,
  })
  async markAsMatched(
    @CurrentUser() user: any,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.markAsMatched(user.id);
  }

  @Post('status/busy')
  @ApiOperation({ summary: 'Mark user as busy' })
  @ApiResponse({
    status: 200,
    description: 'Status updated to busy',
    type: AvailabilityResponseDto,
  })
  async markAsBusy(@CurrentUser() user: any): Promise<AvailabilityResponseDto> {
    return this.availabilityService.markAsBusy(user.id);
  }

  @Post('status/offline')
  @ApiOperation({ summary: 'Mark user as offline' })
  @ApiResponse({
    status: 200,
    description: 'Status updated to offline',
    type: AvailabilityResponseDto,
  })
  async markAsOffline(
    @CurrentUser() user: any,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.markAsOffline(user.id);
  }

  @Post('cleanup/expired')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Clean up expired availability records' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupExpiredAvailabilities(): Promise<{ deleted: number }> {
    const deleted =
      await this.availabilityService.cleanupExpiredAvailabilities();
    return { deleted };
  }

  @Post('cleanup/offline')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: "Mark offline users who haven't sent heartbeat" })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupOfflineUsers(): Promise<{ updated: number }> {
    const updated = await this.availabilityService.cleanupOfflineUsers();
    return { updated };
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Soft delete an availability record' })
  @ApiResponse({
    status: 200,
    description: 'Availability deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  @ApiResponse({
    status: 403,
    description: "Forbidden - cannot delete other user's availability",
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.availabilityService.remove(id, user.id);
  }

  @Delete(':id/hard')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Hard delete an availability record (admin only)' })
  @ApiResponse({ status: 200, description: 'Availability permanently deleted' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.availabilityService.hardDelete(id);
  }
}
