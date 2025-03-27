import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';

export class AddEmailCredentialsDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'your-password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: EmailProviderType, example: EmailProviderType.GMAIL })
  @IsEnum(EmailProviderType)
  @IsNotEmpty()
  provider: EmailProviderType;
} 