import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Quota } from '../entities/quota.entity';
import { EmailCredential } from '../../email/entities/email-credentials.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name?: string;

  @Column()
  tenantId: string;

  @OneToMany(() => Quota, quota => quota.user)
  quotas: Quota[];

  @OneToMany(() => EmailCredential, credential => credential.user)
  emailCredentials: EmailCredential[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 