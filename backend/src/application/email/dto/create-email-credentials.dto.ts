import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';

export class CreateEmailCredentialsDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: EmailProviderType, example: EmailProviderType.GMAIL })
  @IsEnum(EmailProviderType)
  @IsNotEmpty()
  provider: EmailProviderType;

  @ApiProperty({ example: 'access_token_here' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ example: 'refresh_token_here' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
} 