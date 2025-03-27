import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from './controllers/email.controller';
import { EmailService } from './services/email.service';
import { EmailCredentialsController } from './controllers/email-credentials.controller';
import { EmailCredentialsService } from './services/email-credentials.service';
import { Email } from '../../domain/email/entities/email.entity';
import { EmailCredential } from '../../domain/email/entities/email-credentials.entity';
import { User } from '../../domain/user/entities/user.entity';
import { Quota } from '../../domain/user/entities/quota.entity';
import { EmailProcessor } from './processors/email.processor';
import { GmailProvider } from '../../infrastructure/email/services/gmail.provider';
import { RabbitMQService } from '../../infrastructure/queue/services/rabbitmq.service';
import { WarmupEmailGeneratorService } from '../../infrastructure/email/services/warmup-email-generator.service';
import { WarmupSchedulerService } from './services/warmup-scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email, EmailCredential, User, Quota]),
    ScheduleModule.forRoot(),
  ],
  controllers: [EmailController, EmailCredentialsController],
  providers: [
    EmailService,
    EmailCredentialsService,
    EmailProcessor,
    GmailProvider,
    RabbitMQService,
    WarmupEmailGeneratorService,
    WarmupSchedulerService,
  ],
  exports: [EmailService, EmailCredentialsService],
})
export class EmailModule {}