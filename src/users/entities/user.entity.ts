import { UserRole } from 'src/common/enums/user.enums';
import { Profile } from 'src/profiles/entities/profile.entity';
import { ProfilePreference } from 'src/profiles/entities/profile-preference.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserAuthMethod } from './user-auth-method.entity';
import { Session } from './session.entity';
import { Photo } from './photo.entity';
import { Verification } from './verification.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  @Index()
  email?: string;

  @Column({ unique: true, nullable: true })
  @Index()
  phone?: string;

  @Column({ name: 'apple_sub', unique: true, nullable: true })
  @Index()
  appleSub?: string;

  @Column({ name: 'google_sub', unique: true, nullable: true })
  @Index()
  googleSub?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  dateOfBirth?: Date;

  @Column('simple-array', { default: [UserRole.USER] })
  roles: UserRole[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLogoutAt?: Date;

  @Column({ name: 'onboarded_at', type: 'timestamptz', nullable: true })
  onboardedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations

  @OneToOne(() => Profile, (profile) => profile.user)
  @JoinColumn()
  profile: Profile;

  @Column({ nullable: true })
  profileId?: string;

  @OneToOne(() => ProfilePreference, (preference) => preference.user, {
    cascade: true,
  })
  preference?: ProfilePreference;

  @OneToMany(() => UserAuthMethod, (method) => method.user, {
    cascade: true,
  })
  authMethods: UserAuthMethod[];

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Photo, (photo) => photo.user)
  photos: Photo[];

  @OneToMany(() => Verification, (verification) => verification.user)
  verifications: Verification[];

  @OneToMany(() => AuditLog, (log) => log.actorUser)
  auditLogs: AuditLog[];

  // Champ calculé pour obtenir le nom complet de l'utilisateur
  get fullName(): string {
    const safeFirst = this.firstName ?? '';
    const safeLast = this.lastName ?? '';
    return `${safeFirst} ${safeLast}`.trim();
  }
}
