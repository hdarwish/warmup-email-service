import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EmailStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  DELAYED = 'delayed',
  REJECTED = 'rejected'
}
@Entity('emails')
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  toAddress: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column()
  subject: string;

  @Column('text')
  body: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.QUEUED,
  })
  status: EmailStatus;

  @Column({ nullable: true })
  error?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 