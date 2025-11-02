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
  PRIVATE = 'private',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ type: 'date', name: 'birthdate', nullable: true })
  birthdate?: Date;

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
  intention?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ type: 'double precision', nullable: true })
  @Index()
  lat?: number;

  @Column({ type: 'double precision', nullable: true })
  @Index()
  lng?: number;

  @Column({ type: 'varchar', length: 280, nullable: true })
  bio?: string;

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
    youTube?: string;
    facebook?: string;
    spotify?: string;
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

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  matchCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Interest, (interest) => interest.profiles)
  interests: Interest[];

  @ManyToMany(() => Value, (value) => value.profiles)
  values: Value[];

  get isProfileComplete(): boolean {
    return !!(
      this.bio &&
      this.city &&
      this.age &&
      this.gender &&
      (this.photoUrl || this.photoPublicId) &&
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
