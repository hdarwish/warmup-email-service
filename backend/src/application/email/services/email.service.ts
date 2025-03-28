import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailStatus } from '../../../domain/email/entities/email.entity';
import { EmailCredential, EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';
import { Quota } from '../../../domain/user/entities/quota.entity';
import { User } from '../../../domain/user/entities/user.entity';
import { SendEmailDto } from '../dto/send-email.dto';
import { RabbitMQService } from '../../../infrastructure/queue/services/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { promisify } from 'util';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resolveMx = promisify(dns.resolveMx);
  private readonly throwawayDomains: string[];

  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(EmailCredential)
    private readonly credentialsRepository: Repository<EmailCredential>,
    @InjectRepository(Quota)
    private readonly quotaRepository: Repository<Quota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rabbitMQService: RabbitMQService,
    private readonly configService: ConfigService,
  ) {
    // Initialize throwaway domains from environment variable
    const domains = this.configService.get<string>('THROWAWAY_DOMAINS');
    this.throwawayDomains = domains ? domains.split(',').map(d => d.trim()) : [];
  }

  async sendEmail(sendEmailDto: SendEmailDto, userId: string, tenantId: string): Promise<Email> {
    this.logger.log(`Received request to send email for user ${userId}`);
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create email with initial status
    const email = this.emailRepository.create({
      toAddress: sendEmailDto.toAddress,
      subject: sendEmailDto.subject,
      body: sendEmailDto.body,
      userId,
      tenantId,
      status: EmailStatus.QUEUED,
    });

    try {
      // Validate email
      const isValid = await this.validateEmail(email);
      if (!isValid) {
        email.status = EmailStatus.REJECTED;
        email.error = 'Invalid email address';
        return this.emailRepository.save(email);
      }

        // Check quota
      const quota = await this.quotaRepository.findOne({ 
        where: { user: { id: userId } },
        relations: ['user']
      });
      if (!quota) {
        email.status = EmailStatus.FAILED;
        email.error = 'No quota found';
        return this.emailRepository.save(email);
      }

      if (quota.isQuotaExceeded()) {
        email.status = EmailStatus.REJECTED;
        email.error = 'Daily quota exceeded';
        return this.emailRepository.save(email);
      }

      // Get credentials
      const credentials = await this.credentialsRepository.findOne({
        where: { userId, tenantId },
      });

      if (!credentials) {
        email.status = EmailStatus.FAILED;
        email.error = 'No credentials found';
        return this.emailRepository.save(email);
      }

      // Save the email first
      const savedEmail = await this.emailRepository.save(email);
      
      // Queue the email for processing
      await this.rabbitMQService.publishEmail(savedEmail);
      return savedEmail;
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
      email.status = EmailStatus.FAILED;
      email.error = error.message;
      return this.emailRepository.save(email);
    }
  }

  private async validateEmail(email: Email): Promise<boolean> {
    try {
      // 1. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.toAddress)) {
        email.error = 'Invalid email format';
        return false;
      }

      // 2. Check against throwaway domains
      const domain = email.toAddress.split('@')[1].toLowerCase();
      if (this.throwawayDomains.some(d => domain.includes(d))) {
        email.error = 'Throwaway email domain not allowed';
        return false;
      }

      // 3. Validate domain MX records
      try {
        const mxRecords = await this.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
          email.error = 'Invalid email domain (no MX records)';
          return false;
        }
      } catch (error) {
        this.logger.warn(`Failed to resolve MX records for ${domain}: ${error.message}`);
        // Don't fail validation if DNS check fails, just log it
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating email: ${error.message}`);
      email.error = 'Email validation failed';
      return false;
    }
  }

  async getEmailStats(tenantId: string, userId: string): Promise<{
    totalSent: number;
    successRate: number;
    failedCount: number;
    recentActivity: {
      date: string;
      sent: number;
      failed: number;
    }[];
  }> {
    const emails = await this.emailRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
    });

    const totalSent = emails.length;
    const successful = emails.filter(e => e.status === EmailStatus.SENT).length;
    const failed = emails.filter(e => e.status === EmailStatus.FAILED).length;
    const successRate = totalSent > 0 ? (successful / totalSent) * 100 : 0;

    // Get activity for the last 7 days
    const recentActivity = await this.getActivityByDate(emails);

    return {
      totalSent,
      successRate,
      failedCount: failed,
      recentActivity,
    };
  }

  async getQuotaInfo(tenantId: string, userId: string): Promise<{
    dailyQuota: number;
    remainingQuota: number;
    quotaResetTime: string;
    quotaUsage: {
      used: number;
      available: number;
      percentage: number;
    };
  }> {
    const quota = await this.quotaRepository.findOne({
      where: { user: { id: userId } },
    });
  
    if (!quota) {
      throw new NotFoundException('Quota not found for user');
    }
  
    // Reset quota if needed and save changes
    quota.resetDailyQuotaIfNeeded();
    await this.quotaRepository.save(quota);
  
    const dailyLimit = quota.calculateDailyLimit();
    const usedQuota = await this.getUsedQuotaToday(userId);
    const remainingQuota = Math.max(0, dailyLimit - usedQuota);
    const quotaResetTime = this.getQuotaResetTime();
  
    this.logger.debug(`Quota info for user ${userId}:`, {
      dailyLimit,
      usedQuota,
      remainingQuota,
      sentToday: quota.sentToday,
      warmupStage: quota.warmupStage,
      warmupDay: quota.warmupDay
    });

    return {
      dailyQuota: dailyLimit,
      remainingQuota,
      quotaResetTime,
      quotaUsage: {
        used: usedQuota,
        available: dailyLimit,
        percentage: (usedQuota / dailyLimit) * 100,
      },
    };
  }

  private async getUsedQuotaToday(userId: string): Promise<number> {
    const quota = await this.quotaRepository.findOne({
      where: { user: { id: userId } },
    });
  
    if (!quota) {
      throw new NotFoundException('Quota not found for user');
    }
  
    return quota.sentToday;
  }

  private getQuotaResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private async getActivityByDate(emails: Email[]): Promise<{ date: string; sent: number; failed: number; }[]> {
    const activity = new Map<string, { sent: number; failed: number; }>();
    
    // Initialize last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activity.set(dateStr, { sent: 0, failed: 0 });
    }

    // Count emails by date
    emails.forEach(email => {
      const dateStr = email.createdAt.toISOString().split('T')[0];
      if (activity.has(dateStr)) {
        if (email.status === EmailStatus.SENT) {
          activity.get(dateStr).sent++;
        } else if (email.status === EmailStatus.FAILED) {
          activity.get(dateStr).failed++;
        }
      }
    });

    // Convert to array and sort by date
    return Array.from(activity.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getRecentActivity(tenantId: string, userId: string): Promise<Email[]> {
    return this.emailRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }
} 