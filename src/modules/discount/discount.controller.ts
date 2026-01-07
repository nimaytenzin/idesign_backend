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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { DiscountService } from './services/discount.service';
import { DiscountCalculationService } from './services/discount-calculation.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { DiscountQueryDto } from './dto/discount-query.dto';
import { DiscountResponseDto } from './dto/discount-response.dto';
import { CalculateDiscountDto } from './dto/calculate-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('discounts')

export class DiscountController {
  constructor(
    private readonly discountService: DiscountService,
    private readonly discountCalculationService: DiscountCalculationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.create(createDiscountDto);
    return this.discountService.mapToResponse(discount);
  }

  @Get()
  async findAll(
    @Query() queryDto: DiscountQueryDto,
  ): Promise<DiscountResponseDto[]> {
    const discounts = await this.discountService.findAll(queryDto);
    return discounts.map((discount) =>
      this.discountService.mapToResponse(discount),
    );
  }

  @Get('public/active')
  async findActivePublic(
    @Query('autoApplyOnly') autoApplyOnly?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<DiscountResponseDto[]> {
    const options: { autoApplyOnly?: boolean; sortBy?: 'value' | 'endDate' } = {
      autoApplyOnly: autoApplyOnly === 'true',
    };
    
    if (sortBy === 'value' || sortBy === 'endDate') {
      options.sortBy = sortBy;
    }
    
    const discounts = await this.discountService.findActive(undefined, options);
    return discounts.map((discount) =>
      this.discountService.mapToResponse(discount),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.findOne(id);
    return this.discountService.mapToResponse(discount);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.update(id, updateDiscountDto);
    return this.discountService.mapToResponse(discount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.discountService.remove(id);
  }

  @Post(':id/toggle-active')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DiscountResponseDto> {
    const discount = await this.discountService.toggleActive(id);
    return this.discountService.mapToResponse(discount);
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async calculateDiscounts(
    @Body() calculateDto: CalculateDiscountDto,
  ) {
    const result = await this.discountCalculationService.calculateOrderDiscounts(
      calculateDto.orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
      })),
      calculateDto.voucherCode,
    );
    return result;
  }
}

