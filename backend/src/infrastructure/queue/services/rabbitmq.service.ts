import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Email } from '../../../domain/email/entities/email.entity';
import { IQueueService } from '../../../domain/queue/services/queue.service';

@Injectable()
export class RabbitMQService implements IQueueService, OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly queueName = 'email_queue';
  private readonly retryQueueName = 'email_retry_queue';
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
    await this.setupQueues();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.logger.log('Connected to RabbitMQ');

      // Handle connection errors
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      // Handle channel errors
      this.channel.on('error', (err) => {
        this.logger.error('RabbitMQ channel error:', err);
        this.isConnected = false;
      });

      // Handle connection close
      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  private async ensureConnection() {
    if (!this.isConnected || !this.channel) {
      await this.connect();
    }
  }

  private async setupQueues() {
    try {
      await this.ensureConnection();

      // Main queue
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        deadLetterExchange: 'email_dlx',
        deadLetterRoutingKey: 'email_dlq',
      });

      // Retry queue
      await this.channel.assertQueue(this.retryQueueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 300000, // 5 minutes
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': this.queueName,
        },
      });

      this.logger.log('Queues setup completed');
    } catch (error) {
      this.logger.error(`Failed to setup queues: ${error.message}`);
      throw error;
    }
  }

  async publishEmail(email: Email): Promise<void> {
    try {
      await this.ensureConnection();
      const message = Buffer.from(JSON.stringify(email));
      await this.channel.sendToQueue(this.queueName, message, {
        persistent: true,
      });
      this.logger.log(`Email queued for processing: ${email.toAddress}`);
    } catch (error) {
      this.logger.error(`Failed to queue email: ${error.message}`);
      throw error;
    }
  }

  async consumeEmails(callback: (email: Email) => Promise<void>): Promise<void> {
    try {
      await this.ensureConnection();
      await this.channel.consume(this.queueName, async (msg) => {
        if (msg) {
          try {
            const email = JSON.parse(msg.content.toString()) as Email;
            await callback(email);
            this.channel.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`);
            this.channel.nack(msg, false, true);
          }
        }
      });
      this.logger.log('Started consuming emails from queue');
    } catch (error) {
      this.logger.error(`Failed to setup consumer: ${error.message}`);
      throw error;
    }
  }

  async retryEmail(email: Email, delay: number): Promise<void> {
    try {
      await this.ensureConnection();
      const message = Buffer.from(JSON.stringify(email));
      await this.channel.sendToQueue(this.retryQueueName, message, {
        persistent: true,
        expiration: delay.toString(),
      });
      this.logger.log(`Email queued for retry: ${email.toAddress}`);
    } catch (error) {
      this.logger.error(`Failed to queue email for retry: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
} 