import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Email } from '../../../domain/email/entities/email.entity';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
  ) {}

  async publishEmail(email: Email): Promise<void> {
    await this.emailQueue.add('send', email, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async retryEmail(email: Email, delay: number): Promise<void> {
    await this.emailQueue.add('send', email, {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
} 