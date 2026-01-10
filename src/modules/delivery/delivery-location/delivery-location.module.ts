import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryLocationService } from './delivery-location.service';
import { DeliveryLocationController } from './delivery-location.controller';
import { DeliveryLocation } from './entities/delivery-location.entity';

@Module({
  imports: [SequelizeModule.forFeature([DeliveryLocation])],
  controllers: [DeliveryLocationController],
  providers: [
    DeliveryLocationService,
    {
      provide: 'DELIVERY_LOCATION_REPOSITORY',
      useValue: DeliveryLocation,
    },
  ],
  exports: [
    DeliveryLocationService,
    {
      provide: 'DELIVERY_LOCATION_REPOSITORY',
      useValue: DeliveryLocation,
    },
  ],
})
export class DeliveryLocationModule {}
