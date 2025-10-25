import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createAdapter, createAdapterFactory } from 'better-auth/adapters';
import { BetterAuthUser } from './entities/better-auth-user.entity';
import { BetterAuthSession } from './entities/better-auth-session.entity';
import { BetterAuthAccount } from './entities/better-auth-account.entity';

interface TypeORMAdapterConfig {
  debugLogs?: boolean;
}

@Injectable()
export class TypeORMAdapter {
  constructor(
    @InjectRepository(BetterAuthUser)
    private userRepository: Repository<BetterAuthUser>,
    @InjectRepository(BetterAuthSession)
    private sessionRepository: Repository<BetterAuthSession>,
    @InjectRepository(BetterAuthAccount)
    private accountRepository: Repository<BetterAuthAccount>,
  ) {}

  createAdapter(config: TypeORMAdapterConfig = {}) {
    return createAdapterFactory({
      config: {
        adapterId: 'typeorm-postgresql',
        adapterName: 'TypeORM PostgreSQL Adapter',
        usePlural: false,
        debugLogs: config.debugLogs ?? false,
        supportsJSON: true,
        supportsDates: true,
        supportsBooleans: true,
        supportsNumericIds: false,
      },
      adapter: () => ({
        create: async ({ model, data }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          const entity = repository.create(data);
          const saved = await repository.save(entity);
          return saved;
        },

        update: async ({ model, where, update }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          await repository.update(where, update as any);
          const updated = await repository.findOne({ where });
          return updated;
        },

        updateMany: async ({ model, where, update }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          const result = await repository.update(where, update as any);
          return result.affected || 0;
        },

        delete: async ({ model, where }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          await repository.delete(where);
        },

        deleteMany: async ({ model, where }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          const result = await repository.delete(where);
          return result.affected || 0;
        },

        findOne: async ({ model, where, select }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          return await repository.findOne({ where });
        },

        findMany: async ({ model, where, limit, sortBy, offset }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          const queryBuilder = repository.createQueryBuilder();

          if (where) {
            Object.keys(where).forEach((key) => {
              queryBuilder.andWhere(`${key} = :${key}`, { [key]: where[key] });
            });
          }

          if (limit) {
            queryBuilder.limit(limit);
          }

          if (offset) {
            queryBuilder.offset(offset);
          }

          if (sortBy) {
            Object.keys(sortBy).forEach((key) => {
              queryBuilder.orderBy(key, sortBy[key] === 'asc' ? 'ASC' : 'DESC');
            });
          }

          return await queryBuilder.getMany();
        },

        count: async ({ model, where }) => {
          let repository: Repository<any>;
          switch (model) {
            case 'user':
              repository = this.userRepository;
              break;
            case 'session':
              repository = this.sessionRepository;
              break;
            case 'account':
              repository = this.accountRepository;
              break;
            default:
              throw new Error(`Unknown model: ${model}`);
          }

          const queryBuilder = repository.createQueryBuilder();

          if (where) {
            Object.keys(where).forEach((key) => {
              queryBuilder.andWhere(`${key} = :${key}`, { [key]: where[key] });
            });
          }

          return await queryBuilder.getCount();
        },
      }),
    });
  }
}
