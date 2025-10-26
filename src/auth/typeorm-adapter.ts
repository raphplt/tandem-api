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

  private transformWhere(where: any): any {
    if (!where) return {};
    
    // If where is an array (Better Auth format), transform it
    if (Array.isArray(where)) {
      const result: any = {};
      where.forEach((condition) => {
        if (condition.field && condition.value !== undefined) {
          if (condition.operator === 'eq') {
            result[condition.field] = condition.value;
          }
        }
      });
      return result;
    }
    
    // If it's already in TypeORM format, return as is
    return where;
  }

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

          const transformedWhere = this.transformWhere(where);
          await repository.update(transformedWhere, update as any);
          const updated = await repository.findOne({ where: transformedWhere });
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

          const transformedWhere = this.transformWhere(where);
          const result = await repository.update(transformedWhere, update as any);
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

          const transformedWhere = this.transformWhere(where);
          await repository.delete(transformedWhere);
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

          const transformedWhere = this.transformWhere(where);
          const result = await repository.delete(transformedWhere);
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

          const transformedWhere = this.transformWhere(where);
          return await repository.findOne({ where: transformedWhere });
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

          const transformedWhere = this.transformWhere(where);
          const queryBuilder = repository.createQueryBuilder();

          if (transformedWhere && Object.keys(transformedWhere).length > 0) {
            Object.keys(transformedWhere).forEach((key) => {
              queryBuilder.andWhere(`${key} = :${key}`, { [key]: transformedWhere[key] });
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

          const transformedWhere = this.transformWhere(where);
          const queryBuilder = repository.createQueryBuilder();

          if (transformedWhere && Object.keys(transformedWhere).length > 0) {
            Object.keys(transformedWhere).forEach((key) => {
              queryBuilder.andWhere(`${key} = :${key}`, { [key]: transformedWhere[key] });
            });
          }

          return await queryBuilder.getCount();
        },
      }),
    });
  }
}
