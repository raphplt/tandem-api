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

export enum AvailabilityStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  MATCHED = 'matched',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

@Entity('availability')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.IDLE,
  })
  @Index()
  status: AvailabilityStatus;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeat?: Date;

  @Column({ type: 'timestamp', nullable: true })
  queuedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  matchedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  busyAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  offlineAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    timezone?: string;
    timezoneOffset?: number;
    preferredMatchingTime?: string;
    maxWaitTime?: number; // minutes
    autoMatch?: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    deviceInfo?: {
      platform?: string;
      version?: string;
      userAgent?: string;
    };
    location?: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
    };
    networkInfo?: {
      connectionType?: string;
      isOnline?: boolean;
    };
    lastActivity?: Date;
    sessionDuration?: number; // minutes
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields for API responses
  get isOnline(): boolean {
    if (!this.lastHeartbeat) return false;
    const now = new Date();
    const heartbeatTime = new Date(this.lastHeartbeat);
    const diffMinutes = (now.getTime() - heartbeatTime.getTime()) / (1000 * 60);
    return diffMinutes <= 5; // Consider online if heartbeat within 5 minutes
  }

  get timeInQueue(): number {
    if (!this.queuedAt) return 0;
    const now = new Date();
    const queueTime = new Date(this.queuedAt);
    const diffMinutes = (now.getTime() - queueTime.getTime()) / (1000 * 60);
    return Math.floor(diffMinutes);
  }

  get timeSinceLastHeartbeat(): number {
    if (!this.lastHeartbeat) return -1;
    const now = new Date();
    const heartbeatTime = new Date(this.lastHeartbeat);
    const diffMinutes = (now.getTime() - heartbeatTime.getTime()) / (1000 * 60);
    return Math.floor(diffMinutes);
  }

  get canBeMatched(): boolean {
    return (
      this.status === AvailabilityStatus.QUEUED &&
      this.isOnline &&
      this.isAvailable
    );
  }

  get isExpired(): boolean {
    const now = new Date();
    const date = new Date(this.date);
    return now.toDateString() !== date.toDateString();
  }

  get sessionDuration(): number {
    if (!this.metadata?.lastActivity) return 0;
    const now = new Date();
    const lastActivity = new Date(this.metadata.lastActivity);
    const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
    return Math.floor(diffMinutes);
  }
}
