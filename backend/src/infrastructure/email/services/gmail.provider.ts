import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailProvider implements EmailProvider {
  private oauth2Client: OAuth2Client;
  private readonly logger = new Logger(GmailProvider.name);

  constructor(private configService: ConfigService) {
    this.oauth2Client = new OAuth2Client({
      clientId: this.configService.get<string>('GMAIL_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GMAIL_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GMAIL_REDIRECT_URI'),
    });
  }

  setCredentials(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  getCredentials(): any {
    return this.oauth2Client.credentials;
  }

  async getUserEmail(): Promise<string> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.emailAddress;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\r\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(response.credentials);
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      this.logger.error(`Credentials validation failed: ${error.message}`);
      
      // If we have a refresh token, try to refresh
      if (this.oauth2Client.credentials.refresh_token) {
        try {
          await this.refreshToken();
          // Try validating again with new token
          const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
          await gmail.users.getProfile({ userId: 'me' });
          return true;
        } catch (refreshError) {
          this.logger.error(`Token refresh failed: ${refreshError.message}`);
        }
      }
      
      return false;
    }
  }

  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      state,
    });
  }

  async getTokens(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }
}