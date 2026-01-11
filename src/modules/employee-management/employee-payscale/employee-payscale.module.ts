import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmployeePayscaleService } from './employee-payscale.service';
import { EmployeePayscaleController } from './employee-payscale.controller';
import { EmployeePayscale } from './entities/employee-payscale.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { User } from 'src/modules/auth/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([EmployeePayscale, User]),
    AuthModule,
  ],
  controllers: [EmployeePayscaleController],
  providers: [
    EmployeePayscaleService,
    {
      provide: 'EMPLOYEE_PAYSCALE_REPOSITORY',
      useValue: EmployeePayscale,
    },
    {
      provide: 'USER_REPOSITORY',
      useValue: User,
    },
  ],
  exports: [EmployeePayscaleService],
})
export class EmployeePayscaleModule {}
