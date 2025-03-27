import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WarmupEmailGeneratorService {
  private readonly subjects = [
    'Welcome to our community!',
    'Getting started with our service',
    'Important updates about your account',
    'Your account security',
    'New features available',
    'How to get the most out of our service',
    'Your feedback matters',
    'Stay connected with us',
    'Account maintenance notice',
    'Service improvements'
  ];

  private readonly templates = [
    {
      subject: 'Welcome to our community!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Our Community!</h2>
          <p>We're excited to have you join us. Our platform is designed to help you achieve your goals efficiently and effectively.</p>
          <p>Here are a few things you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with other members</li>
          </ul>
          <p>If you have any questions, our support team is here to help.</p>
          <p>Best regards,<br>Your Team</p>
        </div>
      `,
      text: `
        Welcome to Our Community!

        We're excited to have you join us. Our platform is designed to help you achieve your goals efficiently and effectively.

        Here are a few things you can do to get started:
        - Complete your profile
        - Explore our features
        - Connect with other members

        If you have any questions, our support team is here to help.

        Best regards,
        Your Team
      `
    },
    {
      subject: 'Getting started with our service',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Getting Started Guide</h2>
          <p>Thank you for choosing our service. We want to make sure you have everything you need to get started.</p>
          <p>Here's a quick guide to help you:</p>
          <ol>
            <li>Review our documentation</li>
            <li>Set up your preferences</li>
            <li>Start using our features</li>
          </ol>
          <p>Need help? Check out our support resources or contact our team.</p>
          <p>Best regards,<br>Your Team</p>
        </div>
      `,
      text: `
        Getting Started Guide

        Thank you for choosing our service. We want to make sure you have everything you need to get started.

        Here's a quick guide to help you:
        1. Review our documentation
        2. Set up your preferences
        3. Start using our features

        Need help? Check out our support resources or contact our team.

        Best regards,
        Your Team
      `
    }
  ];

  constructor(private configService: ConfigService) {}

  generateEmailContent(): { subject: string; html: string; text: string } {
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];
    return {
      subject: template.subject,
      html: template.html,
      text: template.text
    };
  }
} 