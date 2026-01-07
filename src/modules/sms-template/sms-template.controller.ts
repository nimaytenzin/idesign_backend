import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SmsTemplateService } from './services/sms-template.service';
import { CreateSmsTemplateDto } from './dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from './dto/update-sms-template.dto';
import { TestSmsTemplateDto } from './dto/test-sms-template.dto';
import { SmsTemplateQueryDto } from './dto/sms-template-query.dto';
import { SmsTemplateResponseDto } from './dto/sms-template-response.dto';
import { OrderService } from '../order/order.service';

@Controller('sms-templates')
export class SmsTemplateController {
  constructor(
    private readonly smsTemplateService: SmsTemplateService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateSmsTemplateDto,
  ): Promise<SmsTemplateResponseDto> {
    const template = await this.smsTemplateService.create(createDto);
    return this.mapToResponse(template);
  }

  @Get()
  async findAll(
    @Query() queryDto: SmsTemplateQueryDto,
  ): Promise<SmsTemplateResponseDto[]> {
    const templates = await this.smsTemplateService.findAll(queryDto);
    return templates.map((t) => this.mapToResponse(t));
  }

  @Get('triggers')
  async getAvailableTriggers() {
    return this.smsTemplateService.getAvailableTriggers();
  }

  @Get('placeholders')
  async getAvailablePlaceholders() {
    return this.smsTemplateService.getAvailablePlaceholders();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SmsTemplateResponseDto> {
    const template = await this.smsTemplateService.findOne(+id);
    return this.mapToResponse(template);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSmsTemplateDto,
  ): Promise<SmsTemplateResponseDto> {
    const template = await this.smsTemplateService.update(+id, updateDto);
    return this.mapToResponse(template);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.smsTemplateService.remove(+id);
  }

  @Post(':id/test')
  async testTemplate(
    @Param('id') id: string,
    @Body() testDto: TestSmsTemplateDto,
  ): Promise<{ renderedMessage: string; template: SmsTemplateResponseDto }> {
    const template = await this.smsTemplateService.findOne(+id);
    
    // Validate orderId from request body
    if (!testDto.orderId || isNaN(testDto.orderId)) {
      throw new NotFoundException(`Invalid order ID: ${testDto.orderId}`);
    }
    
    const order = await this.orderService.findOneOrder(testDto.orderId);

    const renderedMessage = this.smsTemplateService.renderTemplate(
      template,
      order,
    );

    return {
      renderedMessage,
      template: this.mapToResponse(template),
    };
  }

  private mapToResponse(template: any): SmsTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      triggerEvent: template.triggerEvent,
      message: template.message,
      isActive: template.isActive,
      sendCount: template.sendCount,
      sendDelay: template.sendDelay,
      orderType: template.orderType,
      priority: template.priority,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

