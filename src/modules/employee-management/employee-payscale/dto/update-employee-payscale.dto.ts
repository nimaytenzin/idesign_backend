import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeePayscaleDto } from './create-employee-payscale.dto';

export class UpdateEmployeePayscaleDto extends PartialType(CreateEmployeePayscaleDto) {}
