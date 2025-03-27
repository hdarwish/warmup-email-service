import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum EmailProviderType {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
}

@Entity('email_credentials')
export class EmailCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({
    type: 'enum',
    enum: EmailProviderType,
  })
  provider: EmailProviderType;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  tokenExpiry?: Date;

  @ManyToOne(() => User, user => user.emailCredentials, { nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 