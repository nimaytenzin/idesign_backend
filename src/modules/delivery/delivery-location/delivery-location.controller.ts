import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DeliveryLocationService } from './delivery-location.service';
import { CreateDeliveryLocationDto } from './dto/create-delivery-location.dto';
import { UpdateDeliveryLocationDto } from './dto/update-delivery-location.dto';
import { DeliveryLocation } from './entities/delivery-location.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@Controller('delivery-locations')
export class DeliveryLocationController {
  constructor(
    private readonly deliveryLocationService: DeliveryLocationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createDeliveryLocationDto: CreateDeliveryLocationDto,
  ): Promise<DeliveryLocation> {
    return this.deliveryLocationService.create(createDeliveryLocationDto);
  }

  @Get()
  findAll(): Promise<DeliveryLocation[]> {
    return this.deliveryLocationService.findAll();
  }
  @Get('with-rates')    
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN,UserRole.STAFF)
  findAllWithRates(): Promise<DeliveryLocation[]> {
    return this.deliveryLocationService.findAllWithRates();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DeliveryLocation> {
    return this.deliveryLocationService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDeliveryLocationDto: UpdateDeliveryLocationDto,
  ): Promise<DeliveryLocation> {
    return this.deliveryLocationService.update(+id, updateDeliveryLocationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.deliveryLocationService.remove(+id);
  }
}
