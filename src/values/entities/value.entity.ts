import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Profile } from '../../profiles/entities/profile.entity';

export enum ValueCategory {
  PERSONAL = 'personal',
  SOCIAL = 'social',
  PROFESSIONAL = 'professional',
  SPIRITUAL = 'spiritual',
  FAMILY = 'family',
  HEALTH = 'health',
  EDUCATION = 'education',
  ENVIRONMENT = 'environment',
  POLITICS = 'politics',
  CULTURE = 'culture',
  OTHER = 'other',
}

@Entity('values')
export class Value {
  @ApiProperty({ description: 'Unique identifier of the value' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the value' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Description of the value' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'Category of the value', enum: ValueCategory })
  @Column({ type: 'enum', enum: ValueCategory })
  category: ValueCategory;

  @ApiProperty({ description: 'Icon or emoji representing the value' })
  @Column({ nullable: true })
  icon?: string;

  @ApiProperty({ description: 'Color associated with the value' })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ description: 'Indicates if the value is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Number of profiles that have this value' })
  @Column({ default: 0 })
  profileCount: number;

  @ApiProperty({ description: 'Importance score of the value' })
  @Column({ default: 0 })
  importanceScore: number;

  @ApiProperty({ description: 'Tags associated with the value' })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ApiPropertyOptional({ description: 'Additional metadata about the value' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    relatedValues?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
    conflictValues?: string[];
  };

  @ApiProperty({ description: 'Timestamp when the value was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the value was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Profile, (profile) => profile.values)
  @JoinTable({
    name: 'profile_values',
    joinColumn: { name: 'valueId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'profileId', referencedColumnName: 'id' },
  })
  profiles: Profile[];

  // Virtual getters
  get isImportant(): boolean {
    return this.importanceScore > 50;
  }

  get isCore(): boolean {
    return this.importanceScore > 100;
  }

  get displayName(): string {
    return this.name;
  }

  get searchableText(): string {
    return `${this.name} ${this.description || ''} ${this.tags.join(' ')}`.toLowerCase();
  }
}
