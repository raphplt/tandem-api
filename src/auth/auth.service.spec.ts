jest.mock('better-auth', () => ({
  betterAuth: jest.fn(() => ({ api: {} })),
}));

jest.mock('better-auth/adapters', () => ({
  createAdapter: jest.fn(),
  createAdapterFactory: jest.fn(() => jest.fn()),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BetterAuthService } from './better-auth.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let mockAuthInstance: {
    api: {
      signUpEmail: jest.Mock;
      signInEmail: jest.Mock;
      signOut: jest.Mock;
      getSession: jest.Mock;
      changePassword: jest.Mock;
    };
  };
  let betterAuthServiceMock: { getAuthInstance: jest.Mock };
  let repositoryMock: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    mockAuthInstance = {
      api: {
        signUpEmail: jest.fn(),
        signInEmail: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        changePassword: jest.fn(),
      },
    };

    betterAuthServiceMock = {
      getAuthInstance: jest.fn(() => mockAuthInstance),
    };

    repositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: BetterAuthService,
          useValue: betterAuthServiceMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
  });

  describe('register', () => {
    it('creates a local user when registration succeeds', async () => {
      const betterAuthUser = {
        id: 'user-id',
        email: 'new@example.com',
        name: 'Jane Doe',
      };

      mockAuthInstance.api.signUpEmail.mockResolvedValue({
        user: betterAuthUser,
        token: 'session-token',
      });
      userRepository.findOne.mockResolvedValue(null as any);
      userRepository.create.mockReturnValue({
        ...betterAuthUser,
        firstName: 'Jane',
        lastName: 'Doe',
        roles: ['user'],
      } as any);
      userRepository.save.mockImplementation((user: any) =>
        Promise.resolve(user),
      );

      const result = await service.register({
        email: 'new@example.com',
        password: 'secret123',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(mockAuthInstance.api.signUpEmail).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.user.id).toBe('user-id');
      expect(result.accessToken).toBe('session-token');
    });
  });

  describe('login', () => {
    it('returns auth response when Better Auth succeeds', async () => {
      const betterAuthUser = {
        id: 'user-id',
        email: 'user@example.com',
        name: 'John Doe',
      };

      mockAuthInstance.api.signInEmail.mockResolvedValue({
        user: betterAuthUser,
        token: 'session-token',
      });
      userRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['user'],
      } as any);

      const result = await service.login({
        email: 'user@example.com',
        password: 'secret123',
      });

      expect(mockAuthInstance.api.signInEmail).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.user.email).toBe('user@example.com');
    });

    it('throws UnauthorizedException when Better Auth rejects', async () => {
      mockAuthInstance.api.signInEmail.mockRejectedValue(new Error('invalid'));

      await expect(
        service.login({ email: 'user@example.com', password: 'oops' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('combines Better Auth session with local user data', async () => {
      mockAuthInstance.api.getSession.mockResolvedValue({
        user: { id: 'user-id', email: 'profile@example.com', name: 'John D' },
      });
      userRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'profile@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['user', 'admin'],
      } as any);

      const profile = await service.getProfile({ authorization: 'token' });

      expect(profile.id).toBe('user-id');
      expect(profile.roles).toEqual(['user', 'admin']);
    });
  });
});
