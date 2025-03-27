import { Body, Controller, Get, Post, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from '../services/email.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Email, EmailStatus } from '../../../domain/email/entities/email.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCredentialsService } from '../services/email-credentials.service';
import { RabbitMQService } from '../../../infrastructure/queue/services/rabbitmq.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Email Operations')
@Controller('email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  private readonly throwawayDomains: string[];

  constructor(
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    private readonly emailCredentialsService: EmailCredentialsService,
    private readonly configService: ConfigService,
  ) {
    // Initialize throwaway domains from environment variable
    const domains = this.configService.get<string>('THROWAWAY_DOMAINS');
    this.throwawayDomains = domains ? domains.split(',').map(d => d.trim()) : [];
  }

  @Post('send')
  @ApiOperation({ summary: 'Queue an email for sending' })
  @ApiResponse({ status: 201, description: 'Email successfully queued' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Daily quota exceeded' })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailService.sendEmail(sendEmailDto, userId, tenantId);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test email to verify email sending functionality' })
  @ApiResponse({ status: 201, description: 'Test email queued successfully' })
  @ApiResponse({ status: 429, description: 'Daily quota exceeded' })
  async testQueue(
    @Request() req,
    @Body() body: { toAddress: string },
  ): Promise<{ message: string }> {
    const { toAddress } = body;
    
    if (!toAddress) {
      throw new BadRequestException('Recipient email address is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toAddress)) {
      throw new BadRequestException('Invalid email address format');
    }

    // Check if email is in throwaway domains
    const domain = toAddress.split('@')[1];
    if (this.throwawayDomains.includes(domain)) {
      throw new BadRequestException('Cannot send to throwaway email domains');
    }

    const email = await this.emailService.sendEmail(
      {
        toAddress,
        subject: 'Test Email from Email Warmup Service',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Email</h2>
            <p>This is a test email from the Email Warmup Service.</p>
            <p>If you received this email, the email sending functionality is working correctly.</p>
            <p>Best regards,<br>Email Warmup Service Team</p>
          </div>
        `,
      },
      req.user.id,
      req.user.tenantId,
    );

    return { message: 'Test email queued successfully' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get email statistics and activity information' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved statistics' })
  async getEmailStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailService.getEmailStats(tenantId, userId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get detailed email logs' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved logs' })
  async getEmailLogs(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.emailService.getRecentActivity(tenantId, userId);
  }

  @Get('quota')
  @ApiOperation({ summary: 'Get current email quota information and usage' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved quota information' })
  async getQuotaInfo(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailService.getQuotaInfo(tenantId, userId);
  }
} 