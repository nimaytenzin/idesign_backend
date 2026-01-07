import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { Outbox } from './entities/outbox.entity';
import { OutboxService } from './services/outbox.service';
import { OutboxProcessorService } from './services/outbox-processor.service';
import { SmsModule } from '../external/sms/sms.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Outbox,
    ]),
    ScheduleModule.forRoot(),
    SmsModule,
  ],
  providers: [
    OutboxService,
    OutboxProcessorService,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}

