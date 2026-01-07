import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CompanyServiceService } from './company-service.service';
import { CompanyServiceController } from './company-service.controller';
import { CompanyService } from './entities/company-service.entity';

@Module({
  imports: [SequelizeModule.forFeature([CompanyService])],
  controllers: [CompanyServiceController],
  providers: [CompanyServiceService],
  exports: [CompanyServiceService],
})
export class CompanyServiceModule {}

