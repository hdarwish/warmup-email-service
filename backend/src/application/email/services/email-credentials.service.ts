import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailCredential, EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';
import { CreateEmailCredentialsDto } from '../dto/create-email-credentials.dto';
import { UpdateEmailCredentialsDto } from '../dto/update-email-credentials.dto';
import { AddEmailCredentialsDto } from '../dto/add-email-credentials.dto';
import { GmailProvider } from '../../../infrastructure/email/services/gmail.provider';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmailCredentialsService {
  constructor(
    @InjectRepository(EmailCredential)
    private readonly emailCredentialsRepository: Repository<EmailCredential>,
    private readonly gmailProvider: GmailProvider,
  ) {}

  async create(
    userId: string,
    tenantId: string,
    createEmailCredentialsDto: CreateEmailCredentialsDto,
  ): Promise<EmailCredential> {
    const credentials = this.emailCredentialsRepository.create({
      ...createEmailCredentialsDto,
      userId,
      tenantId,
    });
    return this.emailCredentialsRepository.save(credentials);
  }

  async update(
    userId: string,
    tenantId: string,
    id: string,
    updateEmailCredentialsDto: UpdateEmailCredentialsDto,
  ): Promise<EmailCredential> {
    const credentials = await this.findOne(userId, tenantId, id);
    Object.assign(credentials, updateEmailCredentialsDto);
    return this.emailCredentialsRepository.save(credentials);
  }

  async findAll(userId: string, tenantId: string, provider?: EmailProviderType): Promise<EmailCredential[]> {
    return this.emailCredentialsRepository.find({
      where: { userId, tenantId, ...(provider && { provider }) },
    });
  }

  async findOne(userId: string, tenantId: string, id: string): Promise<EmailCredential> {
    const credentials = await this.emailCredentialsRepository.findOne({
      where: { id, userId, tenantId },
    });
    if (!credentials) {
      throw new NotFoundException(`Email credentials with ID ${id} not found`);
    }
    return credentials;
  }

  async saveGmailCredentials(userId: string, tenantId: string, tokens: any): Promise<EmailCredential> {
    // Set the tokens in the Gmail provider
    this.gmailProvider.setCredentials(tokens);

    // Get the user's email from Gmail API
    const userEmail = await this.gmailProvider.getUserEmail();

    const credentials = this.emailCredentialsRepository.create({
      userId,
      tenantId,
      email: userEmail,
      provider: EmailProviderType.GMAIL,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(Date.now() + tokens.expiry_date),
    });

    return this.emailCredentialsRepository.save(credentials);
  }

  async refreshTokens(id: string, userId: string, tenantId: string): Promise<EmailCredential> {
    const credentials = await this.emailCredentialsRepository.findOne({
      where: { id, userId, tenantId },
    });

    if (!credentials) {
      throw new Error('Email credentials not found');
    }

    // The token refresh is handled by the provider
    return credentials;
  }

  async addCredentials(
    addEmailCredentialsDto: AddEmailCredentialsDto,
    userId: string,
    tenantId: string,
  ) {
    const hashedPassword = await bcrypt.hash(addEmailCredentialsDto.password, 10);
    const credentials = this.emailCredentialsRepository.create({
      email: addEmailCredentialsDto.email,
      provider: addEmailCredentialsDto.provider,
      password: hashedPassword,
      userId,
      tenantId,
    });
    return this.emailCredentialsRepository.save(credentials);
  }

  async getCredentials(userId: string, tenantId: string) {
    return this.emailCredentialsRepository.find({
      where: { userId, tenantId },
      select: ['id', 'email', 'provider', 'createdAt', 'updatedAt'],
    });
  }

  async deleteGmailCredentials(userId: string, tenantId: string): Promise<void> {
    await this.emailCredentialsRepository.delete({
      userId,
      tenantId,
      provider: EmailProviderType.GMAIL,
    });
  }
} 