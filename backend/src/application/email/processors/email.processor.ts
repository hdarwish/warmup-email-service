import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailStatus } from '../../../domain/email/entities/email.entity';
import { EmailCredential } from '../../../domain/email/entities/email-credentials.entity';
import { Quota } from '../../../domain/user/entities/quota.entity';
import { Logger } from '@nestjs/common';
import { GmailProvider } from '../../../infrastructure/email/services/gmail.provider';
import { EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';
import { RabbitMQService } from '../../../infrastructure/queue/services/rabbitmq.service';

@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(EmailCredential)
    private readonly emailCredentialsRepository: Repository<EmailCredential>,
    @InjectRepository(Quota)
    private readonly quotaRepository: Repository<Quota>,
    private readonly gmailProvider: GmailProvider,
    private readonly rabbitMQService: RabbitMQService,
  ) {
    // Start consuming emails from RabbitMQ
    this.rabbitMQService.consumeEmails(this.handleEmail.bind(this));
  }

  async handleEmail(email: Email) {
    this.logger.log(`Processing email ${email.id}`);

    try {
      // Get email credentials (sender's credentials)
      const credentials = await this.emailCredentialsRepository.findOne({
        where: { userId: email.userId },
      });

      if (!credentials) {
        throw new Error('No email credentials found');
      }

      if (credentials.provider !== EmailProviderType.GMAIL) {
        throw new Error('Only Gmail provider is supported at this time');
      }

      // Set credentials on the Gmail provider
      this.gmailProvider.setCredentials({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expiry_date: credentials.tokenExpiry?.getTime(),
      });

      // Try to validate credentials
      let isValid = await this.gmailProvider.validateCredentials();
      
      // If credentials are invalid, try to refresh the token
      if (!isValid && credentials.refreshToken) {
        this.logger.log('Credentials invalid, attempting to refresh token');
        await this.gmailProvider.refreshToken();
        
        // Get the new credentials from the provider
        const newCredentials = this.gmailProvider.getCredentials();
        
        // Update credentials in database
        credentials.accessToken = newCredentials.access_token;
        credentials.refreshToken = newCredentials.refresh_token;
        credentials.tokenExpiry = new Date(newCredentials.expiry_date);
        await this.emailCredentialsRepository.save(credentials);
        
        // Validate again with new credentials
        isValid = await this.gmailProvider.validateCredentials();
      }

      if (!isValid) {
        throw new Error('Invalid email credentials');
      }

      // Send email using the provider
      await this.gmailProvider.sendEmail(
        email.toAddress,
        email.subject,
        email.body
      );

      // Update email status
      await this.emailRepository.update(
        { id: email.id },
        { status: EmailStatus.SENT, error: null }
      );

      // Update quota
      const quota = await this.quotaRepository.findOne({
        where: { user: { id: email.userId } },
        relations: ['user'],
      });

      if (quota) {
        quota.resetDailyQuotaIfNeeded();
        quota.sentToday++;
        quota.totalSent++;
        await this.quotaRepository.save(quota);
      }

      this.logger.log(`Email ${email.id} sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send email ${email.id}: ${error.message}`);
      
      // Update email status with error
      await this.emailRepository.update(
        { id: email.id },
        { status: EmailStatus.FAILED, error: error.message }
      );

      // Retry after 5 minutes if it's a credential error
      if (error.message.includes('Invalid email credentials')) {
        await this.rabbitMQService.retryEmail(email, 300000);
      }
    }
  }
} 