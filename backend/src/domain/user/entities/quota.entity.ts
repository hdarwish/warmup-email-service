import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export enum WarmupStage {
  INITIAL = 'initial',
  BUILDING = 'building',
  ESTABLISHED = 'established',
  MAXIMUM = 'maximum'
}

@Entity('quotas')
export class Quota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 10 })
  initialDailyLimit: number;

  @Column({ default: 100 })
  maxDailyLimit: number;

  @Column({ default: 0 })
  sentToday: number;

  @Column({ default: 0 })
  totalSent: number;

  @Column({
    type: 'enum',
    enum: WarmupStage,
    default: WarmupStage.INITIAL
  })
  warmupStage: WarmupStage;

  @Column({ default: 1 })
  warmupDay: number;

  @Column({ type: 'float', default: 1.5 })
  growthRate: number;

  @Column({ default: () => 'CURRENT_DATE' })
  lastResetDate: Date;

  @ManyToOne(() => User, user => user.quotas)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  calculateDailyLimit(): number {
    if (this.warmupStage === WarmupStage.INITIAL && this.warmupDay < 7) {
      return this.initialDailyLimit;
    }
    
    if (this.warmupStage === WarmupStage.MAXIMUM) {
      return this.maxDailyLimit;
    }

    let limit = Math.min(
      this.initialDailyLimit * Math.pow(this.growthRate, Math.floor(this.warmupDay / 7)),
      this.maxDailyLimit
    );

    return Math.floor(limit);
  }

  isQuotaExceeded(): boolean {
    return this.sentToday >= this.calculateDailyLimit();
  }

  resetDailyQuotaIfNeeded(): boolean {
    const today = new Date();
    const lastReset = new Date(this.lastResetDate);

    if (today.toDateString() !== lastReset.toDateString()) {
      this.sentToday = 0;
      this.lastResetDate = today;
      
      if (this.warmupStage !== WarmupStage.MAXIMUM) {
        this.warmupDay++;
        
        if (this.warmupDay >= 28) {
          this.warmupStage = WarmupStage.MAXIMUM;
        } else if (this.warmupDay >= 21) {
          this.warmupStage = WarmupStage.ESTABLISHED;
        } else if (this.warmupDay >= 7) {
          this.warmupStage = WarmupStage.BUILDING;
        }
      }

      return true;
    }
    
    return false;
  }
} 