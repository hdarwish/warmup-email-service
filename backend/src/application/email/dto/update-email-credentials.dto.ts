import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmailProviderType } from '../../../domain/email/entities/email-credentials.entity';

export class UpdateEmailCredentialsDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: EmailProviderType, example: EmailProviderType.GMAIL, required: false })
  @IsEnum(EmailProviderType)
  @IsOptional()
  provider?: EmailProviderType;

  @ApiProperty({ example: 'access_token_here', required: false })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiProperty({ example: 'refresh_token_here', required: false })
  @IsString()
  @IsOptional()
  refreshToken?: string;
} 