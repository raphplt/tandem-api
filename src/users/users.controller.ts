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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { OwnershipGuard } from '../auth/ownership.guard';
import { Roles, Public } from '../auth/decorators';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //TODO : doublon, a supprimer
  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
    example: 'john',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    example: 10,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [UserResponseDto],
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<UserResponseDto[]> {
    return this.usersService.searchUsers(query, limit);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own profile',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own profile',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, currentUser.id);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user account (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only delete own profile',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<void> {
    return this.usersService.remove(id, currentUser.id);
  }

  @Patch(':id/activate')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Activate user account (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async activate(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Deactivate user account (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async deactivate(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.deactivate(id);
  }

  @Delete(':id/hard')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete user (admin only)' })
  @ApiResponse({
    status: 204,
    description: 'User permanently deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.usersService.hardDelete(id);
  }
}
