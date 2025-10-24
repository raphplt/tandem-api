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

export enum InterestCategory {
  SPORTS = 'sports',
  MUSIC = 'music',
  ARTS = 'arts',
  TRAVEL = 'travel',
  FOOD = 'food',
  TECHNOLOGY = 'technology',
  HEALTH = 'health',
  EDUCATION = 'education',
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  LIFESTYLE = 'lifestyle',
  OTHER = 'other',
}

@Entity('interests')
export class Interest {
  @ApiProperty({ description: 'Unique identifier of the interest' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the interest' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ description: 'Description of the interest' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Category of the interest',
    enum: InterestCategory,
  })
  @Column({ type: 'enum', enum: InterestCategory })
  category: InterestCategory;

  @ApiProperty({ description: 'Icon or emoji representing the interest' })
  @Column({ nullable: true })
  icon?: string;

  @ApiProperty({ description: 'Color associated with the interest' })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ description: 'Indicates if the interest is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Number of profiles that have this interest' })
  @Column({ default: 0 })
  profileCount: number;

  @ApiProperty({ description: 'Popularity score of the interest' })
  @Column({ default: 0 })
  popularityScore: number;

  @ApiProperty({ description: 'Tags associated with the interest' })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata about the interest',
  })
  @Column('jsonb', { nullable: true })
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };

  @ApiProperty({ description: 'Timestamp when the interest was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the interest was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Profile, (profile) => profile.interests)
  @JoinTable({
    name: 'profile_interests',
    joinColumn: { name: 'interestId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'profileId', referencedColumnName: 'id' },
  })
  profiles: Profile[];

  // Virtual getters
  get isPopular(): boolean {
    return this.popularityScore > 50;
  }

  get isTrending(): boolean {
    return this.popularityScore > 100;
  }

  get displayName(): string {
    return this.name;
  }

  get searchableText(): string {
    return `${this.name} ${this.description || ''} ${this.tags.join(' ')}`.toLowerCase();
  }
}
