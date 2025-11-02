import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('onboarding_drafts')
export class OnboardingDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', unique: true })
  @Index()
  deviceId: string;

  @Column({ name: 'payload_json', type: 'jsonb', default: {} })
  payloadJson: Record<string, unknown>;

  @Column({ name: 'token_hash', nullable: true })
  tokenHash?: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
