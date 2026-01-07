import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CompanyClientService } from './company-client.service';
import { CompanyClientController } from './company-client.controller';
import { CompanyClient } from './entities/company-client.entity';

@Module({
  imports: [SequelizeModule.forFeature([CompanyClient])],
  controllers: [CompanyClientController],
  providers: [CompanyClientService],
  exports: [CompanyClientService],
})
export class CompanyClientModule {}

