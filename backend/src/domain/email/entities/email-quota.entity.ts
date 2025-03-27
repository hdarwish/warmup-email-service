import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email_quota')
export class EmailQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'int' })
  dailyLimit: number;

  @Column({ type: 'int' })
  currentCount: number;

  @Column({ type: 'int' })
  successfulAttempts: number;

  @Column({ type: 'int' })
  totalAttempts: number;

  @Column()
  lastReset: Date;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
} 