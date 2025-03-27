import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Email } from '../../domain/email/entities/email.entity';
import { EmailCredential } from '../../domain/email/entities/email-credentials.entity';
import { User } from '../../domain/user/entities/user.entity';
import { Quota } from '../../domain/user/entities/quota.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Email, EmailCredential, User, Quota],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
}); 