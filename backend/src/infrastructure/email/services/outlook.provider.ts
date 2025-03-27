import { Injectable } from '@nestjs/common';
import { EmailProvider } from '../../../domain/interfaces/email-provider.interface';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

@Injectable()
export class OutlookProvider implements EmailProvider {
  private client: Client;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.OUTLOOK_TENANT_ID,
      process.env.OUTLOOK_CLIENT_ID,
      process.env.OUTLOOK_CLIENT_SECRET
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    this.client = Client.initWithMiddleware({ authProvider });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.client.api('/me/sendMail').post({
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: body
        },
        toRecipients: [
          {
            emailAddress: {
              address: to
            }
          }
        ]
      }
    });
  }

  async refreshToken(): Promise<void> {
    // The ClientSecretCredential handles token refresh automatically
    // No additional implementation needed
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.client.api('/me').get();
      return true;
    } catch (error) {
      return false;
    }
  }
} 