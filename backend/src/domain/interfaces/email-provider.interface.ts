export interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  refreshToken(): Promise<void>;
  validateCredentials(): Promise<boolean>;
} 