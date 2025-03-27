import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('queue_jobs')
export class QueueJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  queueName: string;

  @Column()
  jobName: string;

  @Column('jsonb')
  data: any;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING
  })
  status: JobStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 