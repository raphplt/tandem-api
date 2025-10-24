import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum MatchType {
  DAILY = 'daily',
  MANUAL = 'manual',
  PREMIUM = 'premium',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user1: User;

  @Column()
  user1Id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user2: User;

  @Column()
  user2Id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  profile1: Profile;

  @Column()
  profile1Id: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  profile2: Profile;

  @Column()
  profile2Id: string;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  @Index()
  status: MatchStatus;

  @Column({
    type: 'enum',
    enum: MatchType,
    default: MatchType.DAILY,
  })
  type: MatchType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  compatibilityScore: number;

  @Column({ type: 'jsonb', nullable: true })
  scoringBreakdown?: {
    ageCompatibility: number;
    locationCompatibility: number;
    interestCompatibility: number;
    valueCompatibility: number;
    responseRateBonus: number;
    activityBonus: number;
    verificationBonus: number;
  };

  @Column({ type: 'date' })
  @Index()
  matchDate: Date;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @Column({ nullable: true })
  rejectedAt?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  expiredAt?: Date;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  isMutual: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    matchingAlgorithm?: string;
    matchingVersion?: string;
    timezoneOffset?: number;
    user1Preferences?: any;
    user2Preferences?: any;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields for API responses
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isPending(): boolean {
    return this.status === MatchStatus.PENDING && !this.isExpired;
  }

  get isAccepted(): boolean {
    return this.status === MatchStatus.ACCEPTED;
  }

  get isRejected(): boolean {
    return this.status === MatchStatus.REJECTED;
  }

  get daysSinceMatch(): number {
    const now = new Date();
    const matchTime = new Date(this.matchDate);
    const diffTime = Math.abs(now.getTime() - matchTime.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get timeUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const expiryTime = new Date(this.expiresAt);
    const diffTime = expiryTime.getTime() - now.getTime();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60)) : 0; // hours
  }
}
