import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from 'src/common/enums/user.enums';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MAX_PASSWORD_LENGTH = 128;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, dateOfBirth, roles } =
      createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    this.validatePassword(password);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      roles: roles || [UserRole.USER],
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);
    return this.mapToResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.mapToResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId?: string,
  ): Promise<UserResponseDto> {
    // Check if user is trying to update someone else's profile
    if (currentUserId && currentUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If password is being updated, validate and hash it
    if (updateUserDto.password) {
      this.validatePassword(updateUserDto.password);
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
    }

    // Check for email conflicts if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user
    await this.userRepository.update(id, {
      ...updateUserDto,
      dateOfBirth: updateUserDto.dateOfBirth
        ? new Date(updateUserDto.dateOfBirth)
        : undefined,
    });

    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedUser!);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    // Check if user is trying to delete someone else's profile
    if (currentUserId && currentUserId !== id) {
      throw new ForbiddenException('You can only delete your own profile');
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete by deactivating the user
    await this.userRepository.update(id, { isActive: false });
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.update(id, { isActive: true });
    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedUser!);
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.update(id, { isActive: false });
    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });

    return this.mapToResponseDto(updatedUser!);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateLastLogout(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogoutAt: new Date(),
    });
  }

  async searchUsers(query: string, limit = 10): Promise<UserResponseDto[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where(
        'user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query',
        {
          query: `%${query}%`,
        },
      )
      .andWhere('user.isActive = :isActive', { isActive: true })
      .limit(limit)
      .getMany();

    return users.map((user) => this.mapToResponseDto(user));
  }

  private validatePassword(password: string): void {
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`,
      );
    }

    if (password.length > this.MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must not exceed ${this.MAX_PASSWORD_LENGTH} characters`,
      );
    }

    // Check for at least one uppercase letter, one lowercase letter, and one number
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
  }

  private mapToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      roles: user.roles,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      lastLogoutAt: user.lastLogoutAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
