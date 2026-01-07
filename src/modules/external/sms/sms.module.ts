import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
 import { SmsMessageFormatter } from './sms-message.formatter';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [],
  providers: [SmsService, SmsMessageFormatter],
  exports: [SmsService, SmsMessageFormatter], // Export both services for use in other modules
})
export class SmsModule {}
