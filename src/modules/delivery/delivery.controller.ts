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
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryRateDto } from './dto/create-delivery-rate.dto';
import { UpdateDeliveryRateDto } from './dto/update-delivery-rate.dto';
import { DeliveryRateQueryDto } from './dto/delivery-rate-query.dto';
import { DeliveryRate } from './entities/delivery-rate.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('delivery-rates')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
 
  create(
    @Body() createDeliveryRateDto: CreateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    return this.deliveryService.create(createDeliveryRateDto);
  }

  @Get()
  findAll(@Query() query: DeliveryRateQueryDto): Promise<DeliveryRate[]> {
    return this.deliveryService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DeliveryRate> {
    return this.deliveryService.findOne(+id);
  }

  @Patch(':id')

  update(
    @Param('id') id: string,
    @Body() updateDeliveryRateDto: UpdateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    return this.deliveryService.update(+id, updateDeliveryRateDto);
  }

  @Delete(':id')
 
  remove(@Param('id') id: string): Promise<void> {
    return this.deliveryService.remove(+id);
  }
}

