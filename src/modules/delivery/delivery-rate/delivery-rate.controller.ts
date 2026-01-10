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
import { DeliveryRateService } from './delivery-rate.service';
import { CreateDeliveryRateDto } from './dto/create-delivery-rate.dto';
import { UpdateDeliveryRateDto } from './dto/update-delivery-rate.dto';
import { DeliveryRate } from './entities/delivery-rate.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('delivery-rates')
export class DeliveryRateController {
  constructor(private readonly deliveryRateService: DeliveryRateService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createDeliveryRateDto: CreateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    return this.deliveryRateService.create(createDeliveryRateDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.STAFF)
  findAll(): Promise<DeliveryRate[]> {
    return this.deliveryRateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DeliveryRate> {
    return this.deliveryRateService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDeliveryRateDto: UpdateDeliveryRateDto,
  ): Promise<DeliveryRate> {
    return this.deliveryRateService.update(+id, updateDeliveryRateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.deliveryRateService.remove(+id);
  }
}
