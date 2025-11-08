import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from '../../matches/entities/match.entity';
import { Message } from '../../messages/entities/message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum ConversationType {
  DAILY = 'daily',
  EXTENDED = 'extended',
  PREMIUM = 'premium',
}

@Entity('conversations')
export class Conversation {
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

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn()
  match: Match;

  @Column()
  matchId: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  @Index()
  status: ConversationStatus;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DAILY,
  })
  type: ConversationType;

  @Column({ type: 'timestamp' })
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @Column({ nullable: true })
  extendedAt?: Date;

  @Column({ nullable: true })
  closedAt?: Date;

  @Column({ nullable: true })
  archivedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isReadByUser1: boolean;

  @Column({ default: false })
  isReadByUser2: boolean;

  @Column({ nullable: true })
  lastMessageAt?: Date;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    timezoneOffset?: number;
    extensionCount?: number;
    lastActivity?: Date;
    user1LastSeen?: Date;
    user2LastSeen?: Date;
  };

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields for API responses
  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isActiveConversation(): boolean {
    return (
      this.isActive &&
      this.status === ConversationStatus.ACTIVE &&
      !this.isExpired
    );
  }

  get timeUntilExpiry(): number {
    const now = new Date();
    const expiryTime = new Date(this.expiresAt);
    const diffTime = expiryTime.getTime() - now.getTime();
    return diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60)) : 0; // hours
  }

  get duration(): number {
    const now = new Date();
    const startTime = new Date(this.startTime);
    const diffTime = now.getTime() - startTime.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60)); // hours
  }

  get canBeExtended(): boolean {
    return (
      this.status === ConversationStatus.ACTIVE &&
      this.type === ConversationType.DAILY &&
      this.timeUntilExpiry < 2
    ); // Less than 2 hours remaining
  }

  get hasUnreadMessages(): boolean {
    return !this.isReadByUser1 || !this.isReadByUser2;
  }
}
