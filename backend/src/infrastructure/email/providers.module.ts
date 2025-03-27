import { Module } from '@nestjs/common';
import { GmailProvider } from './services/gmail.provider';
import { OutlookProvider } from './services/outlook.provider';

@Module({
  providers: [GmailProvider, OutlookProvider],
  exports: [GmailProvider, OutlookProvider],
})
export class ProvidersModule {} 