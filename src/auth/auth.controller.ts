import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { BetterAuthService } from './better-auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly betterAuthService: BetterAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('🚀 Register endpoint called');
    console.log('📝 Register data received:', registerDto);
    console.log('📝 Raw body:', req.body);

    try {
      // Validation des données d'entrée
      if (!registerDto.email || !registerDto.password || !registerDto.firstName || !registerDto.lastName) {
        console.error('❌ Missing required fields');
        res.status(400).json({ 
          message: 'Missing required fields',
          required: ['email', 'password', 'firstName', 'lastName']
        });
        return;
      }

      const authInstance = this.betterAuthService.getAuthInstance();

      const signUpData = {
        email: registerDto.email,
        password: registerDto.password,
        name: `${registerDto.firstName} ${registerDto.lastName}`,
      };

      console.log('📝 SignUp data prepared:', signUpData);

      const result = await authInstance.api.signUpEmail({
        body: signUpData,
      });

      console.log('📝 Better Auth result:', result);

      if (!result.user) {
        console.error('❌ No user returned from Better Auth');
        res.status(400).json({ message: 'Registration failed - no user created' });
        return;
      }

      // Créer l'utilisateur dans notre table User pour la compatibilité
      await this.betterAuthService.createUserFromBetterAuth(result.user);

      const response: AuthResponseDto = {
        accessToken: result.token || '',
        refreshToken: result.token || '',
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          roles: ['user'],
        },
      };

      console.log('✅ Registration successful');
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      res.status(400).json({
        message: 'Registration failed',
        error: error.message,
        details:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const authInstance = this.betterAuthService.getAuthInstance();

      const signInData = {
        email: loginDto.email,
        password: loginDto.password,
      };

      const result = await authInstance.api.signInEmail({
        body: signInData,
      });

      if (!result.user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Mettre à jour la dernière connexion
      await this.betterAuthService.updateUserLastLogin(result.user.id);

      const response: AuthResponseDto = {
        accessToken: result.token || '',
        refreshToken: result.token || '',
        expiresIn: 60 * 60 * 24 * 7, // 7 jours
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.name?.split(' ')[0] || '',
          lastName: result.user.name?.split(' ')[1] || '',
          roles: ['user'],
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Login failed' });
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const authInstance = this.betterAuthService.getAuthInstance();

      await authInstance.api.signOut({
        headers: req.headers as any,
      });

      res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getProfile(@Req() req: Request): Promise<any> {
    const authInstance = this.betterAuthService.getAuthInstance();
    const session = await authInstance.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.name?.split(' ')[0] || '',
      lastName: session.user.name?.split(' ')[1] || '',
      roles: ['user'],
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid old password',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid new password',
  })
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const authInstance = this.betterAuthService.getAuthInstance();

      const result = await authInstance.api.changePassword({
        body: {
          currentPassword: body.oldPassword,
          newPassword: body.newPassword,
        },
      });

      if (!result) {
        res.status(400).json({ message: 'Password change failed' });
        return;
      }

      res.status(200).json({ message: 'Password successfully changed' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(400).json({ message: 'Password change failed' });
    }
  }
}