import { UserRole } from 'src/common/enums/user.enums';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Champ calculé pour obtenir le nom complet de l'utilisateur
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
