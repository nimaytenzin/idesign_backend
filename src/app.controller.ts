import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { SmsService } from './modules/external/sms/sms.service';

@Controller('')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly smsService: SmsService,
  ) {}

  @Get()
  getWelcome() {
    return this.appService.getWelcome();
  }

  /**
   * GET /test-sms — send a test SMS. Query: phone, message, header (optional sender name).
   * Example: /test-sms?phone=17123456&message=Hello&header=IDesign
   */
  @Get('test-sms')
  async testSms(
    @Query('phone') phone: string,
    @Query('message') message: string,
    @Query('header') header?: string,
  ) {
    return this.smsService.sendSmsNotification({
      phoneNumber: phone,
      message,
      senderName: header,
    });
  }
}
