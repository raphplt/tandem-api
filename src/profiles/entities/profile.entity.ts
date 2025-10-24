import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  ManyToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Interest } from '../../interests/entities/interest.entity';
import { Value } from '../../values/entities/value.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  @Index()
  age?: number;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column({
    type: 'enum',
    enum: Gender,
    array: true,
    default: [],
  })
  interestedIn: Gender[];

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  photoPublicId?: string;

  @Column({
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  visibility: ProfileVisibility;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isComplete: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    ageRange?: { min: number; max: number };
    maxDistance?: number;
    interests?: string[];
    values?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  matchCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Interest, (interest) => interest.profiles)
  interests: Interest[];

  @ManyToMany(() => Value, (value) => value.profiles)
  values: Value[];

  // Virtual fields for API responses
  get isProfileComplete(): boolean {
    return !!(
      this.bio &&
      this.city &&
      this.age &&
      this.gender &&
      this.photoUrl &&
      this.interestedIn.length > 0
    );
  }

  get ageRange(): { min: number; max: number } {
    return this.preferences?.ageRange || { min: 18, max: 100 };
  }

  get maxDistance(): number {
    return this.preferences?.maxDistance || 50;
  }
}
