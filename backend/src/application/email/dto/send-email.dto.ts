import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ example: 'recipient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  toAddress: string;

  @ApiProperty({ example: 'Test Subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Email body content' })
  @IsString()
  @IsNotEmpty()
  body: string;
} 