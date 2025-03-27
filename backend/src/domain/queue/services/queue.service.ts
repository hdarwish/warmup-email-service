import { Email } from '../../email/entities/email.entity';

export interface IQueueService {
  publishEmail(email: Email): Promise<void>;
  consumeEmails(callback: (email: Email) => Promise<void>): Promise<void>;
  retryEmail(email: Email, delay: number): Promise<void>;
}

export class QueueService implements IQueueService {
  constructor() {}

  async publishEmail(email: Email): Promise<void> {
    // Implementation will be in the infrastructure layer
    throw new Error('Method not implemented.');
  }

  async consumeEmails(callback: (email: Email) => Promise<void>): Promise<void> {
    // Implementation will be in the infrastructure layer
    throw new Error('Method not implemented.');
  }

  async retryEmail(email: Email, delay: number): Promise<void> {
    // Implementation will be in the infrastructure layer
    throw new Error('Method not implemented.');
  }
} 