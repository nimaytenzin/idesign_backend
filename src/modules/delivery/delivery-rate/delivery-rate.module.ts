import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeliveryRateService } from './delivery-rate.service';
import { DeliveryRateController } from './delivery-rate.controller';
import { DeliveryRate } from './entities/delivery-rate.entity';
import { DeliveryLocationModule } from '../delivery-location/delivery-location.module';

@Module({
  imports: [
    SequelizeModule.forFeature([DeliveryRate]),
    DeliveryLocationModule,
  ],
  controllers: [DeliveryRateController],
  providers: [
    DeliveryRateService,
    {
      provide: 'DELIVERY_RATE_REPOSITORY',
      useValue: DeliveryRate,
    },
  ],
  exports: [DeliveryRateService],
})
export class DeliveryRateModule {}
