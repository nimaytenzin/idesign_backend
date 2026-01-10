import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import {
  SendSmsNotificationDto,
  SendSmsApiDto,
  SmsResponseDto,
} from './dto/create-sm.dto';
import { getCarrier, isValidBhutanPhoneNumber } from './sms.utils';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly smsApiUrl: string;
  private readonly smsApiKey: string;
  private readonly defaultSenderName: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.smsApiUrl = this.configService.get<string>('SMS_URL');
    this.smsApiKey = this.configService.get<string>('SMS_KEY');
    this.defaultSenderName =
      this.configService.get<string>('SMS_SENDER_NAME') || 'IDesign';

    if (!this.smsApiUrl || !this.smsApiKey) {
      this.logger.warn(
        'SMS service configuration missing. SMS_URL and SMS_KEY environment variables are required.',
      );
    }
  }

  /**
   * Send SMS notification
   */
  async sendSmsNotification(
    data: SendSmsNotificationDto,
  ): Promise<SmsResponseDto> {
    try {
      this.logger.log(`Sending SMS to ${data.phoneNumber}: ${data.message}`);

      // Validate phone number
      if (!isValidBhutanPhoneNumber(data.phoneNumber)) {
        throw new BadRequestException('Invalid Bhutanese phone number format');
      }

      // Format phone number
      const formattedPhone = Number(data.phoneNumber);

      // Get carrier
      const carrier = getCarrier(formattedPhone);

      console.log('Carrier:', carrier);

      console.log('Formatted Phone:', formattedPhone);

      // Prepare SMS API payload
      const smsPayload: SendSmsApiDto = {
        auth: this.smsApiKey,
        carrier: carrier,
        contact: formattedPhone,
        message: data.message,
        senderName: data.senderName || this.defaultSenderName,
      };

      console.log('SMS API Payload:', smsPayload);

      this.logger.debug(
        'SMS API Payload:',
        JSON.stringify(smsPayload, null, 2),
      );

      // Send SMS via API
      const response = await lastValueFrom(
        this.httpService.post<SmsResponseDto>(this.smsApiUrl, smsPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }),
      );

      this.logger.log(
        `SMS sent successfully to ${data.phoneNumber}. Response: ${response.data.message}`,
      );

      return {
        message: response.data.message || 'SMS sent successfully',
        status: 'SUCCESS',
        success: true,
      };
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'SMS sending failed';
      let statusCode: number | undefined;

      if (error.response) {
        // HTTP error response
        statusCode = error.response.status;
        const statusText = error.response.statusText || 'Unknown error';
        const responseData = error.response.data;
        
        if (statusCode === 502) {
          errorMessage = `SMS API Bad Gateway (502) - SMS service may be temporarily unavailable`;
        } else if (statusCode === 503) {
          errorMessage = `SMS API Service Unavailable (503) - SMS service is temporarily down`;
        } else if (statusCode === 504) {
          errorMessage = `SMS API Gateway Timeout (504) - SMS service took too long to respond`;
        } else {
          errorMessage = `SMS API error: ${statusCode} ${statusText} - ${
            responseData?.message || responseData?.error || 'Unknown error'
          }`;
        }
        
        this.logger.error(
          `Failed to send SMS to ${data.phoneNumber}: ${errorMessage}`,
        );
        this.logger.debug(
          `SMS API Error Details: Status ${statusCode}, Response: ${JSON.stringify(responseData)}`,
        );
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Unable to connect to SMS service - Connection refused';
        this.logger.error(
          `Failed to send SMS to ${data.phoneNumber}: ${errorMessage}`,
        );
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'SMS service request timed out';
        this.logger.error(
          `Failed to send SMS to ${data.phoneNumber}: ${errorMessage}`,
        );
      } else {
        errorMessage = `SMS failed: ${error.message || 'Unknown error'}`;
        this.logger.error(
          `Failed to send SMS to ${data.phoneNumber}: ${errorMessage}`,
          error.stack,
        );
      }

      return {
        message: errorMessage,
        status: statusCode ? `HTTP_${statusCode}` : 'FAILED',
        success: false,
      };
    }
  }
}
