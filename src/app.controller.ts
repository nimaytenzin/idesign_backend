import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { SmsService } from './modules/external/sms/sms.service';
import { SendSmsNotificationDto } from './modules/external/sms/dto/create-sm.dto';

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

}
