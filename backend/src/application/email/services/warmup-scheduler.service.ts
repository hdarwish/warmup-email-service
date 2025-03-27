import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quota } from '../../../domain/user/entities/quota.entity';
import { EmailCredential } from '../../../domain/email/entities/email-credentials.entity';
import { RabbitMQService } from '../../../infrastructure/queue/services/rabbitmq.service';
import { WarmupEmailGeneratorService } from '../../../infrastructure/email/services/warmup-email-generator.service';
import { ConfigService } from '@nestjs/config';
import { Email, EmailStatus } from '../../../domain/email/entities/email.entity';

@Injectable()
export class WarmupSchedulerService {
  private readonly logger = new Logger(WarmupSchedulerService.name);
  private readonly warmupRecipients: string[];

  constructor(
    @InjectRepository(Quota)
    private readonly quotaRepository: Repository<Quota>,
    @InjectRepository(EmailCredential)
    private readonly credentialsRepository: Repository<EmailCredential>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    private readonly rabbitMQService: RabbitMQService,
    private readonly warmupEmailGenerator: WarmupEmailGeneratorService,
    private readonly configService: ConfigService,
  ) {
    // Initialize warmup recipients from environment variable
    const recipients = this.configService.get<string>('WARMUP_RECIPIENTS');
    this.warmupRecipients = recipients ? recipients.split(',').map(r => r.trim()) : [];
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleWarmupEmails() {
    this.logger.log('Starting warmup email scheduling');
    
    try {
      // Get all active quotas
      const quotas = await this.quotaRepository.find({
        where: { sentToday: 0 }, // Only process quotas that haven't sent today
        relations: ['user'],
      });

      for (const quota of quotas) {
        const credentials = await this.credentialsRepository.findOne({
          where: { userId: quota.user.id },
        });

        if (!credentials) {
          this.logger.warn(`No credentials found for user ${quota.user.id}`);
          continue;
        }

        const dailyLimit = quota.calculateDailyLimit();
        const emailsToSend = Math.min(dailyLimit, this.warmupRecipients.length);

        // Queue warmup emails
        for (let i = 0; i < emailsToSend; i++) {
          const recipient = this.warmupRecipients[i % this.warmupRecipients.length];
          const content = this.warmupEmailGenerator.generateEmailContent();

          // Create and save email entity
          const email = this.emailRepository.create({
            toAddress: recipient,
            subject: content.subject,
            body: content.html,
            userId: quota.user.id,
            tenantId: quota.user.tenantId,
            status: EmailStatus.QUEUED,
          });

          const savedEmail = await this.emailRepository.save(email);
          await this.rabbitMQService.publishEmail(savedEmail);

          // Add delay between emails (5-15 minutes)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 600000 + 300000));
        }

        this.logger.log(`Queued ${emailsToSend} warmup emails for user ${quota.user.id}`);
      }
    } catch (error) {
      this.logger.error(`Error scheduling warmup emails: ${error.message}`);
    }
  }
} 