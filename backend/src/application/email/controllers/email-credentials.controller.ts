import { Body, Controller, Get, Post, Put, Param, UseGuards, Query, Req, Res, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailCredentialsService } from '../services/email-credentials.service';
import { CreateEmailCredentialsDto } from '../dto/create-email-credentials.dto';
import { UpdateEmailCredentialsDto } from '../dto/update-email-credentials.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AddEmailCredentialsDto } from '../dto/add-email-credentials.dto';
import { GmailProvider } from '../../../infrastructure/email/services/gmail.provider';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';

@ApiTags('Email Credentials')
@Controller('email-credentials')
export class EmailCredentialsController {
  constructor(
    private readonly emailCredentialsService: EmailCredentialsService,
    private readonly gmailProvider: GmailProvider,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add new email credentials' })
  @ApiResponse({ status: 201, description: 'Credentials successfully added' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addCredentials(
    @Body() addEmailCredentialsDto: AddEmailCredentialsDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailCredentialsService.addCredentials(
      addEmailCredentialsDto,
      userId,
      tenantId,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update email credentials' })
  @ApiResponse({ status: 200, description: 'Credentials successfully updated' })
  @ApiResponse({ status: 404, description: 'Credentials not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmailCredentialsDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailCredentialsService.update(userId, tenantId, id, updateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all email credentials for the user' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved credentials' })
  async getCredentials(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailCredentialsService.getCredentials(userId, tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get email credentials by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved credentials' })
  @ApiResponse({ status: 404, description: 'Credentials not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailCredentialsService.findOne(id, userId, tenantId);
  }

  @Post(':id/refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh email credentials tokens' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  @ApiResponse({ status: 404, description: 'Credentials not found' })
  async refreshTokens(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.emailCredentialsService.refreshTokens(id, userId, tenantId);
  }

  @Get('gmail/auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Gmail OAuth2 flow' })
  @ApiResponse({ status: 200, description: 'Returns Gmail OAuth2 consent screen URL' })
  async initiateGmailAuth(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    // Create a temporary token with the user ID and tenant ID
    const state = jwt.sign({ userId, tenantId }, process.env.JWT_SECRET, { expiresIn: '5m' });
    const authUrl = this.gmailProvider.getAuthUrl(state);
    return { url: authUrl };
  }

  @Get('gmail/callback')
  @ApiOperation({ summary: 'Handle Gmail OAuth2 callback' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with Gmail' })
  async handleGmailCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Verify the state token and get the user ID and tenant ID
      const decoded = jwt.verify(state, process.env.JWT_SECRET) as { userId: string; tenantId: string };
      const { userId, tenantId } = decoded;

      const tokens = await this.gmailProvider.getTokens(code);
      const credentials = await this.emailCredentialsService.saveGmailCredentials(userId, tenantId, tokens);
      
      // Redirect back to the frontend with success message
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/dashboard?gmailAuth=success`);
    } catch (error) {
      // Redirect back to the frontend with error message
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/dashboard?gmailAuth=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  @Delete('gmail')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Gmail credentials' })
  @ApiResponse({ status: 200, description: 'Gmail credentials successfully deleted' })
  async deleteGmailCredentials(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    await this.emailCredentialsService.deleteGmailCredentials(userId, tenantId);
    return { message: 'Gmail credentials successfully deleted' };
  }
} 