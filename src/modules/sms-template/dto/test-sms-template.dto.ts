import { IsNumber, IsNotEmpty } from 'class-validator';

export class TestSmsTemplateDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}

