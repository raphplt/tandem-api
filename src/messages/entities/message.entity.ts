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
import { Conversation } from '../../conversations/entities/conversation.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  EMOJI = 'emoji',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn()
  conversation: Conversation;

  @Column()
  conversationId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  @Index()
  status: MessageStatus;

  @Column({ nullable: true })
  replyToId?: string;

  @Column({ nullable: true })
  editedAt?: Date;

  @Column({ nullable: true })
  deletedAt?: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
    emoji?: string;
    systemMessage?: string;
    deliveryAttempts?: number;
    lastDeliveryAttempt?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields for API responses
  get isSystemMessage(): boolean {
    return this.type === MessageType.SYSTEM;
  }

  get isMediaMessage(): boolean {
    return this.type === MessageType.IMAGE;
  }

  get isEmojiMessage(): boolean {
    return this.type === MessageType.EMOJI;
  }

  get ageInMinutes(): number {
    const now = new Date();
    const messageTime = new Date(this.createdAt);
    const diffTime = now.getTime() - messageTime.getTime();
    return Math.floor(diffTime / (1000 * 60));
  }

  get ageInHours(): number {
    return Math.floor(this.ageInMinutes / 60);
  }

  get ageInDays(): number {
    return Math.floor(this.ageInHours / 24);
  }

  get formattedAge(): string {
    if (this.ageInMinutes < 1) return 'Just now';
    if (this.ageInMinutes < 60) return `${this.ageInMinutes}m ago`;
    if (this.ageInHours < 24) return `${this.ageInHours}h ago`;
    return `${this.ageInDays}d ago`;
  }
}
